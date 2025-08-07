<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { AnalyticsAreaChart } from "$lib/components/ui/chart/index.js";

  // Type definitions
  interface Website {
    id: string;
    domain: string;
    created_at: string;
  }

  interface AnalyticsData {
    visitors: number;
    pageviews: number;
    bounce_rate: number;
    avg_session_duration: number;
  }

  interface PageData {
    path: string;
    views: number;
    unique_visitors: number;
  }

  interface CountryData {
    country: string;
    visitors: number;
  }

  interface ReferrerData {
    referrer: string;
    visitors: number;
  }

  interface Goal {
    name: string;
    conversions: number;
    conversion_rate: number;
  }

  interface ChartDataPoint {
    date: string;
    value: number;
    visitors?: number;
    pageviews?: number;
  }

  // State variables with proper types
  let selectedWebsite: Website | null = null;
  let websites: Website[] = [];
  let showDropdown = false;
  let showAddWebsite = false;
  let showSetupInstructions = false;
  let justAddedWebsite: Website | null = null;
  let newWebsiteDomain = '';
  let addingWebsite = false;
  let addWebsiteError = '';
  let timeRange = '7d';
  let loading = false;

  // Analytics data
  let analyticsData: AnalyticsData = {
    visitors: 0,
    pageviews: 0,
    bounce_rate: 0,
    avg_session_duration: 0
  };
  let topPages: PageData[] = [];
  let topCountries: CountryData[] = [];
  let topReferrers: ReferrerData[] = [];
  let goals: Goal[] = [];
  let chartData: ChartDataPoint[] = [];

  const API_BASE = 'http://localhost:3001';

  async function fetchWithAuth(url: string, options: RequestInit = {}) {
    const token = browser ? localStorage.getItem('arjuna_token') : null;
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async function loadWebsites() {
    try {
      const response = await fetchWithAuth(`${API_BASE}/analytics/websites`);
      const websites_data = await response.json();
      
      if (response.ok) {
        websites = websites_data || [];
        if (websites.length > 0 && !selectedWebsite) {
          selectedWebsite = websites[0];
          await loadAnalytics();
        }
      }
    } catch (error) {
      console.error('Failed to load websites:', error);
    }
  }

  async function loadAnalytics() {
    if (!selectedWebsite) return;
    
    loading = true;
    try {
      // Load stats
      const statsResponse = await fetchWithAuth(`${API_BASE}/analytics/stats/${selectedWebsite.id}?range=${timeRange}`);
      const statsData = await statsResponse.json();
      
      if (statsResponse.ok) {
        analyticsData = {
          visitors: statsData.uniqueVisitors || 0,
          pageviews: statsData.pageviews || 0,
          bounce_rate: statsData.bounceRate || 0,
          avg_session_duration: statsData.avgDuration || 0
        };
      }

      // Load pages
      const pagesResponse = await fetchWithAuth(`${API_BASE}/analytics/pages/${selectedWebsite.id}?range=${timeRange}`);
      const pagesData = await pagesResponse.json();
      if (pagesResponse.ok) {
        topPages = pagesData || [];
      }

      // Load countries
      const countriesResponse = await fetchWithAuth(`${API_BASE}/analytics/countries/${selectedWebsite.id}?range=${timeRange}`);
      const countriesData = await countriesResponse.json();
      if (countriesResponse.ok) {
        topCountries = countriesData || [];
      }

      // Load referrers
      const referrersResponse = await fetchWithAuth(`${API_BASE}/analytics/referrers/${selectedWebsite.id}?range=${timeRange}`);
      const referrersData = await referrersResponse.json();
      if (referrersResponse.ok) {
        topReferrers = referrersData || [];
      }

      // For now, create empty chart data since we don't have historical data
      chartData = [];
      goals = [];
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      loading = false;
    }
  }

  async function handleTimeRangeChange(newRange: string) {
    timeRange = newRange;
    await loadAnalytics();
  }

  async function addWebsite() {
    if (!newWebsiteDomain.trim()) {
      addWebsiteError = 'Please enter a domain name';
      return;
    }

    // Basic domain validation
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
    if (!domainRegex.test(newWebsiteDomain.trim())) {
      addWebsiteError = 'Please enter a valid domain name';
      return;
    }

    addingWebsite = true;
    addWebsiteError = '';

    try {
      const response = await fetchWithAuth(`${API_BASE}/analytics/websites`, {
        method: 'POST',
        body: JSON.stringify({ domain: newWebsiteDomain.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const newWebsite: Website = data.website;
        websites = [...websites, newWebsite];
        selectedWebsite = newWebsite;
        justAddedWebsite = newWebsite;
        showAddWebsite = false;
        showSetupInstructions = true;
        newWebsiteDomain = '';
        await loadAnalytics();
      } else {
        addWebsiteError = data.error || 'This feature requires database setup. For now, you can view the demo interface.';
      }
    } catch (error) {
      addWebsiteError = 'Network error. Please try again.';
      console.error('Add website error:', error);
    } finally {
      addingWebsite = false;
    }
  }

  async function deleteWebsite(website: Website) {
    if (!confirm(`Are you sure you want to delete ${website.domain}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetchWithAuth(`${API_BASE}/analytics/websites/${website.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        websites = websites.filter(w => w.id !== website.id);
        if (selectedWebsite && selectedWebsite.id === website.id) {
          selectedWebsite = websites.length > 0 ? websites[0] : null;
          if (selectedWebsite) {
            await loadAnalytics();
          }
        }
      } else {
        alert(data.error || 'This feature requires database setup.');
      }
    } catch (error) {
      alert('Network error. Please try again.');
      console.error('Delete website error:', error);
    }
  }

  function selectWebsite(website: Website) {
    selectedWebsite = website;
    showDropdown = false;
    loadAnalytics();
  }

  function formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  function formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.website-dropdown')) {
      showDropdown = false;
    }
  }

  onMount(() => {
    loadWebsites();
    if (browser) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  });
</script>

<svelte:head>
  <title>Analytics Dashboard</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h1 class="text-2xl font-semibold text-neutral-900">Analytics Dashboard</h1>
      <p class="text-sm text-neutral-500 mt-1">Track your website performance and visitor insights</p>
    </div>
    
    <!-- Website Selector & Add Button -->
    <div class="flex items-center gap-3">
      {#if websites.length > 0}
        <div class="website-dropdown relative">
          <button
            class="btn btn-secondary flex items-center gap-2 min-w-[200px] justify-between"
            on:click={() => showDropdown = !showDropdown}
          >
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>{selectedWebsite ? selectedWebsite.domain : 'Select Website'}</span>
            </div>
            <svg class="w-4 h-4 transition-transform {showDropdown ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {#if showDropdown}
            <div class="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-neutral-200 py-2 z-10 fade-in">
              <div class="px-3 py-2 text-xs font-medium text-neutral-500 uppercase tracking-wide border-b border-neutral-100">
                Your Websites
              </div>
              {#each websites as website}
                <div class="flex items-center justify-between px-3 py-2 hover:bg-neutral-50 group">
                  <button
                    class="flex items-center gap-2 flex-1 text-left"
                    on:click={() => selectWebsite(website)}
                  >
                    <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span class="text-sm text-neutral-700">{website.domain}</span>
                  </button>
                  <button
                    class="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-red-500 transition-all"
                    on:click|stopPropagation={() => deleteWebsite(website)}
                    title="Delete website"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/if}
      
      <button
        class="btn btn-primary"
        on:click={() => showAddWebsite = true}
      >
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Add Website
      </button>
    </div>
  </div>

  {#if websites.length === 0}
    <!-- Empty State -->
    <div class="text-center py-12">
      <div class="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
        <svg class="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-neutral-900 mb-2">Welcome to Analytics</h3>
      <p class="text-neutral-500 mb-6 max-w-md mx-auto">
        Get started by adding your first website to track visitor analytics, page views, and performance metrics.
      </p>
      <button
        class="btn btn-primary"
        on:click={() => showAddWebsite = true}
      >
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Add Your First Website
      </button>
    </div>
  {:else if selectedWebsite}
    <!-- Time Range Selector -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <svg class="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span class="text-sm text-neutral-600">Time Range:</span>
      </div>
      <select
        class="input w-auto"
        bind:value={timeRange}
        on:change={(e) => handleTimeRangeChange((e.target as HTMLSelectElement).value)}
      >
        <option value="24h">Last 24 hours</option>
        <option value="7d">Last 7 days</option>
        <option value="30d">Last 30 days</option>
        <option value="90d">Last 90 days</option>
      </select>
    </div>

    <!-- Metrics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="metric-card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-neutral-600">Unique Visitors</p>
            <p class="text-2xl font-semibold text-neutral-900 mt-1">{formatNumber(analyticsData.visitors)}</p>
          </div>
          <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>
      </div>

      <div class="metric-card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-neutral-600">Page Views</p>
            <p class="text-2xl font-semibold text-neutral-900 mt-1">{formatNumber(analyticsData.pageviews)}</p>
          </div>
          <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
        </div>
      </div>

      <div class="metric-card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-neutral-600">Bounce Rate</p>
            <p class="text-2xl font-semibold text-neutral-900 mt-1">{analyticsData.bounce_rate.toFixed(1)}%</p>
          </div>
          <div class="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        </div>
      </div>

      <div class="metric-card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-neutral-600">Avg. Session</p>
            <p class="text-2xl font-semibold text-neutral-900 mt-1">{formatDuration(analyticsData.avg_session_duration)}</p>
          </div>
          <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Professional Analytics Chart -->
    <AnalyticsAreaChart
      data={chartData}
      bind:timeRange={timeRange}
      title="Visitors Over Time"
      description="Analytics data showing visitor trends for {selectedWebsite?.domain || 'your website'}"
      showTimeSelector={true}
      class="mb-6"
    />

    <!-- Goals -->
    {#if goals.length > 0}
      <div class="card p-6">
        <h3 class="text-lg font-medium text-neutral-900 mb-4">Goals</h3>
        <div class="space-y-4">
          {#each goals as goal, index}
            <div class="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
              <div>
                <h4 class="font-medium text-neutral-900">{goal.name}</h4>
                <p class="text-sm text-neutral-500">{goal.conversions} conversions</p>
              </div>
              <div class="text-right">
                <p class="text-lg font-semibold text-neutral-900">{goal.conversion_rate.toFixed(1)}%</p>
                <p class="text-sm text-neutral-500">conversion rate</p>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Top Pages -->
      <div class="card p-6">
        <h3 class="text-lg font-medium text-neutral-900 mb-4">Top Pages</h3>
        {#if topPages.length > 0}
          <div class="space-y-3">
            {#each topPages.slice(0, 8) as page}
              <div class="flex items-center justify-between p-3 hover:bg-neutral-50 rounded-lg transition-colors group">
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-neutral-900 truncate">{page.path}</p>
                  <p class="text-xs text-neutral-500">{page.unique_visitors} unique visitors</p>
                </div>
                <div class="text-right ml-4">
                  <p class="text-sm font-semibold text-neutral-900">{formatNumber(page.views)}</p>
                  <p class="text-xs text-neutral-500">views</p>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <div class="text-center py-8 text-neutral-400">
            <svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p class="text-sm">No page data yet</p>
          </div>
        {/if}
      </div>

      <!-- Top Countries -->
      <div class="card p-6">
        <h3 class="text-lg font-medium text-neutral-900 mb-4">Top Countries</h3>
        {#if topCountries.length > 0}
          <div class="space-y-3">
            {#each topCountries.slice(0, 8) as country}
              <div class="flex items-center justify-between p-3 hover:bg-neutral-50 rounded-lg transition-colors group">
                <div class="flex items-center gap-3">
                  <div class="w-6 h-4 bg-neutral-200 rounded-sm flex items-center justify-center">
                    <span class="text-xs">🌍</span>
                  </div>
                  <span class="text-sm font-medium text-neutral-900">{country.country}</span>
                </div>
                <span class="text-sm font-semibold text-neutral-900">{formatNumber(country.visitors)}</span>
              </div>
            {/each}
          </div>
        {:else}
          <div class="text-center py-8 text-neutral-400">
            <svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-sm">No location data yet</p>
          </div>
        {/if}
      </div>

      <!-- Top Referrers -->
      <div class="card p-6">
        <h3 class="text-lg font-medium text-neutral-900 mb-4">Top Referrers</h3>
        {#if topReferrers.length > 0}
          <div class="space-y-3">
            {#each topReferrers.slice(0, 8) as referrer}
              <div class="flex items-center justify-between p-3 hover:bg-neutral-50 rounded-lg transition-colors group">
                <div class="flex items-center gap-3">
                  <div class="w-6 h-6 bg-neutral-200 rounded-full flex items-center justify-center">
                    <svg class="w-3 h-3 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                  <span class="text-sm font-medium text-neutral-900 truncate">{referrer.referrer}</span>
                </div>
                <span class="text-sm font-semibold text-neutral-900">{formatNumber(referrer.visitors)}</span>
              </div>
            {/each}
          </div>
        {:else}
          <div class="text-center py-8 text-neutral-400">
            <svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            <p class="text-sm">No referrer data yet</p>
          </div>
        {/if}
      </div>
    </div>

    <!-- No Data State -->
    {#if topPages.length === 0 && topCountries.length === 0 && topReferrers.length === 0 && chartData.length === 0}
      <div class="card p-8 text-center">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-neutral-100 rounded-full mb-4">
          <svg class="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-neutral-900 mb-2">No data yet</h3>
        <p class="text-neutral-500 mb-6 max-w-md mx-auto">
          We haven't received any data from <strong>{selectedWebsite.domain}</strong> yet. Make sure you've installed the tracking script.
        </p>
        <button
          class="btn btn-secondary"
          on:click={() => { showSetupInstructions = true; justAddedWebsite = selectedWebsite; }}
        >
          View Setup Instructions
        </button>
      </div>
    {/if}
  {/if}
</div>

<!-- Add Website Modal -->
{#if showAddWebsite}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 fade-in">
    <div class="bg-white rounded-xl max-w-md w-full scale-in">
      <div class="p-6 border-b border-neutral-200">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-neutral-900">Add Website</h3>
          <button
            class="text-neutral-400 hover:text-neutral-600"
            on:click={() => { showAddWebsite = false; addWebsiteError = ''; newWebsiteDomain = ''; }}
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p class="text-neutral-600 mt-1">Enter your website domain to start tracking analytics</p>
      </div>
      
      <div class="p-6">
        <form class="space-y-4" on:submit|preventDefault={addWebsite}>
          <div>
            <label for="domain" class="block text-sm font-medium text-neutral-700 mb-2">
              Website Domain
            </label>
            <input
              id="domain"
              type="text"
              class="input focus-ring"
              placeholder="example.com"
              bind:value={newWebsiteDomain}
              disabled={addingWebsite}
              required
            />
            <p class="text-xs text-neutral-500 mt-1">
              Enter without http:// or https://
            </p>
          </div>

          {#if addWebsiteError}
            <div class="bg-red-50 border border-red-200 rounded-lg p-3 fade-in">
              <div class="flex items-center">
                <svg class="w-4 h-4 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="text-sm text-red-700">{addWebsiteError}</p>
              </div>
            </div>
          {/if}

          <div class="flex gap-3 pt-4">
            <button
              type="button"
              class="btn btn-secondary flex-1"
              on:click={() => { showAddWebsite = false; addWebsiteError = ''; newWebsiteDomain = ''; }}
              disabled={addingWebsite}
            >
              Cancel
            </button>
            <button
              type="submit"
              class="btn btn-primary flex-1 focus-ring"
              disabled={addingWebsite || !newWebsiteDomain.trim()}
            >
              {#if addingWebsite}
                <div class="flex items-center justify-center">
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding...
                </div>
              {:else}
                Add Website
              {/if}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}

<!-- Setup Instructions Modal -->
{#if showSetupInstructions && justAddedWebsite}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 fade-in">
    <div class="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto scale-in">
      <div class="p-6 border-b border-neutral-200">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-neutral-900">Setup Tracking</h3>
          <button
            class="text-neutral-400 hover:text-neutral-600"
            on:click={() => showSetupInstructions = false}
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p class="text-neutral-600">Now let's set up tracking for <strong>{justAddedWebsite.domain}</strong></p>
      </div>
      
      <div class="p-6 space-y-6">
        <div>
          <h4 class="font-medium text-neutral-900 mb-3">1. Add the tracking script</h4>
          <p class="text-sm text-neutral-600 mb-3">Copy and paste this script tag into the &lt;head&gt; section of your website:</p>
          <div class="bg-neutral-900 text-neutral-100 p-4 rounded-lg text-sm font-mono overflow-x-auto">
            &lt;script src="{API_BASE}/tracker.js" data-domain="{justAddedWebsite.domain}" defer&gt;&lt;/script&gt;
          </div>
        </div>
        
        <div>
          <h4 class="font-medium text-neutral-900 mb-3">2. Verify installation</h4>
          <p class="text-sm text-neutral-600 mb-3">After adding the script, visit your website and check that analytics are being tracked. It may take a few minutes for data to appear.</p>
        </div>

        <div>
          <h4 class="font-medium text-neutral-900 mb-3">3. Privacy-first tracking</h4>
          <p class="text-sm text-neutral-600">Our analytics respect user privacy by:</p>
          <ul class="text-sm text-neutral-600 mt-2 space-y-1 ml-4">
            <li>• No cookies or personal data collection</li>
            <li>• No cross-site tracking</li>
            <li>• Anonymized visitor data</li>
            <li>• GDPR compliant by design</li>
          </ul>
        </div>

        <div class="flex gap-3 pt-4">
          <button
            class="btn btn-secondary flex-1"
            on:click={() => showSetupInstructions = false}
          >
            I'll set this up later
          </button>
          <button
            class="btn btn-primary flex-1"
            on:click={() => showSetupInstructions = false}
          >
            Done, start tracking
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
