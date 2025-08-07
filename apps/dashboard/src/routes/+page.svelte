<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import * as Card from "$lib/components/ui/card/index.js";
  import { SimpleLineChart } from "$lib/components/ui/chart/index.js";
  
  let loading = true;
  let user = null;
  let selectedWebsite = null;
  let websites = [];
  let timeRange = '7d';
  let showWebsiteDropdown = false;
  let showAddWebsite = false;
  let newWebsiteDomain = '';
  let newWebsiteName = '';
  let stats = {
    pageviews: 0,
    uniqueVisitors: 0,
    bounceRate: 0,
    avgDuration: 0,
    liveVisitors: 0
  };
  
  let topPages = [];
  let topCountries = [];
  let topReferrers = [];
  let goals = [];
  let chartData = [];

  const API_BASE = 'http://localhost:3001';

  onMount(async () => {
    if (browser) {
      const token = localStorage.getItem('arjuna_token');
      if (!token) {
        goto('/login');
        return;
      }
      
      try {
        const response = await fetch(`${API_BASE}/auth/verify`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          localStorage.removeItem('arjuna_token');
          goto('/login');
          return;
        }
        
        const data = await response.json();
        user = data.user;
        
        await loadWebsites();
        
        if (websites.length > 0) {
          selectedWebsite = websites[0];
          await loadDashboardData();
        }
        
      } catch (error) {
        console.error('Auth check failed:', error);
        goto('/login');
      } finally {
        loading = false;
      }
    }
  });

  async function loadWebsites() {
    try {
      const token = localStorage.getItem('arjuna_token');
      const response = await fetch(`${API_BASE}/analytics/websites`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        websites = await response.json();
      }
    } catch (error) {
      console.error('Failed to load websites:', error);
    }
  }
  
  async function loadDashboardData() {
    if (!selectedWebsite) return;

    try {
      const token = localStorage.getItem('arjuna_token');
      const headers = {
        'Authorization': `Bearer ${token}`
      };

      const [statsResponse, pagesResponse, countriesResponse, referrersResponse] = await Promise.all([
        fetch(`${API_BASE}/analytics/stats/${selectedWebsite.id}?period=${timeRange}`, { headers }),
        fetch(`${API_BASE}/analytics/pages/${selectedWebsite.id}?period=${timeRange}`, { headers }),
        fetch(`${API_BASE}/analytics/countries/${selectedWebsite.id}?period=${timeRange}`, { headers }),
        fetch(`${API_BASE}/analytics/referrers/${selectedWebsite.id}?period=${timeRange}`, { headers })
      ]);

      if (statsResponse.ok) stats = await statsResponse.json();
      if (pagesResponse.ok) topPages = await pagesResponse.json();
      if (countriesResponse.ok) topCountries = await countriesResponse.json();
      if (referrersResponse.ok) topReferrers = await referrersResponse.json();

      // Generate mock goals and chart data for now
      generateMockGoals();
      generateMockChartData();

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  }

  function generateMockGoals() {
    goals = topPages.slice(0, 8).map((page, index) => ({
      goal: `Visit ${page.path}`,
      unique: Math.floor(page.views * 0.6),
      total: page.views,
      conversionRate: ((Math.floor(page.views * 0.6) / stats.uniqueVisitors) * 100).toFixed(2)
    }));
  }

  function generateMockChartData() {
    const days = timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    chartData = Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      return {
        date: date.toISOString().split('T')[0],
        value: Math.floor(Math.random() * 1000) + 100
      };
    });
  }

  async function handleTimeRangeChange(newRange: string) {
    timeRange = newRange;
    await loadDashboardData();
  }

  async function handleWebsiteChange(website: any) {
    selectedWebsite = website;
    showWebsiteDropdown = false;
    await loadDashboardData();
  }

  async function addNewWebsite() {
    if (!newWebsiteDomain.trim()) return;

    try {
      const token = localStorage.getItem('arjuna_token');
      const response = await fetch(`${API_BASE}/analytics/websites`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          domain: newWebsiteDomain.trim(),
          name: newWebsiteName.trim() || newWebsiteDomain.trim()
        })
      });

      if (response.ok) {
        const newWebsite = await response.json();
        websites = [...websites, newWebsite];
        selectedWebsite = newWebsite;
        newWebsiteDomain = '';
        newWebsiteName = '';
        showAddWebsite = false;
        showWebsiteDropdown = false;
        await loadDashboardData();
      }
    } catch (error) {
      console.error('Failed to add website:', error);
    }
  }
  
  function logout() {
    if (browser) {
      localStorage.removeItem('arjuna_token');
      goto('/login');
    }
  }
  
  function formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  function getPeriodLabel(range: string): string {
    switch (range) {
      case '24h': return 'Last 24 hours';
      case '7d': return 'Last 7 days';
      case '30d': return 'Last 30 days';
      case '90d': return 'Last 90 days';
      default: return 'Last 7 days';
    }
  }

  // Close dropdown when clicking outside
  function handleClickOutside(event: MouseEvent) {
    if (!event.target.closest('.website-dropdown')) {
      showWebsiteDropdown = false;
      showAddWebsite = false;
    }
  }
</script>

<svelte:head>
  <title>Analytics Dashboard</title>
</svelte:head>

<svelte:window on:click={handleClickOutside} />

{#if loading}
  <div class="min-h-screen flex items-center justify-center bg-white">
    <div class="w-6 h-6 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
  </div>
{:else}
  <div class="min-h-screen bg-white">
    <!-- Header -->
    <header class="border-b border-gray-200 bg-white">
      <div class="max-w-7xl mx-auto px-6 py-6">
        <div class="flex items-center justify-between">
          <!-- Website Selector -->
          <div class="flex items-center space-x-6">
            <div class="relative website-dropdown">
              <button
                on:click={() => showWebsiteDropdown = !showWebsiteDropdown}
                class="flex items-center space-x-2 text-lg font-medium text-gray-900 hover:text-gray-600 transition-colors"
              >
                <span>{selectedWebsite ? selectedWebsite.domain : 'Select Website'}</span>
                <svg class="w-4 h-4 transition-transform {showWebsiteDropdown ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {#if showWebsiteDropdown}
                <div class="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded shadow-lg z-50">
                  <!-- Existing Websites -->
                  {#each websites as website}
                    <button
                      on:click={() => handleWebsiteChange(website)}
                      class="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                    >
                      <div class="font-medium text-gray-900">{website.domain}</div>
                      <div class="text-sm text-gray-500">{website.name}</div>
                    </button>
                  {/each}

                  <!-- Add Website Button -->
                  <button
                    on:click={() => showAddWebsite = !showAddWebsite}
                    class="w-full px-4 py-3 text-left text-gray-600 hover:bg-gray-50 border-t border-gray-200 transition-colors"
                  >
                    <div class="flex items-center space-x-2">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                      </svg>
                      <span class="font-medium">Add new website</span>
                    </div>
                  </button>

                  <!-- Add Website Form -->
                  {#if showAddWebsite}
                    <div class="p-4 border-t border-gray-200 bg-gray-50">
                      <div class="space-y-3">
                        <div>
                          <input
                            type="text"
                            placeholder="example.com"
                            bind:value={newWebsiteDomain}
                            class="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="Website name (optional)"
                            bind:value={newWebsiteName}
                            class="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                          />
                        </div>
                        <div class="flex space-x-2">
                          <button
                            on:click={addNewWebsite}
                            class="px-3 py-1.5 text-sm bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors"
                          >
                            Add
                          </button>
                          <button
                            on:click={() => showAddWebsite = false}
                            class="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  {/if}
                </div>
              {/if}
            </div>
          </div>
          
          <!-- Controls -->
          <div class="flex items-center space-x-6">
            <div class="flex items-center space-x-3">
              <select
                bind:value={timeRange}
                on:change={(e) => handleTimeRangeChange(e.target.value)}
                class="text-sm border border-gray-200 rounded px-2 py-1 focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
              >
                <option value="24h">24h</option>
                <option value="7d">7d</option>
                <option value="30d">30d</option>
                <option value="90d">90d</option>
              </select>
            </div>
            
            <button
              on:click={logout}
              class="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-6 py-8">
      {#if selectedWebsite}
        <!-- Stats Grid -->
        <div class="grid grid-cols-2 md:grid-cols-5 gap-6 mb-12">
          <div class="stat-card">
            <div class="text-2xl font-medium text-gray-900 mb-1">{stats.pageviews.toLocaleString()}</div>
            <div class="text-xs text-gray-500 uppercase tracking-wide">Page Views</div>
          </div>
          
          <div class="stat-card">
            <div class="text-2xl font-medium text-gray-900 mb-1">{stats.uniqueVisitors.toLocaleString()}</div>
            <div class="text-xs text-gray-500 uppercase tracking-wide">Visitors</div>
          </div>
          
          <div class="stat-card">
            <div class="text-2xl font-medium text-gray-900 mb-1">{stats.bounceRate}%</div>
            <div class="text-xs text-gray-500 uppercase tracking-wide">Bounce Rate</div>
          </div>
          
          <div class="stat-card">
            <div class="text-2xl font-medium text-gray-900 mb-1">{formatDuration(stats.avgDuration)}</div>
            <div class="text-xs text-gray-500 uppercase tracking-wide">Avg Duration</div>
          </div>
          
          <div class="stat-card">
            <div class="flex items-center">
              <div class="text-2xl font-medium text-gray-900 mr-2">{stats.liveVisitors}</div>
              {#if stats.liveVisitors > 0}
                <div class="w-1.5 h-1.5 bg-gray-900 rounded-full animate-pulse"></div>
              {/if}
            </div>
            <div class="text-xs text-gray-500 uppercase tracking-wide">Live</div>
          </div>
        </div>

        <!-- Chart Section -->
        <div class="mb-12">
          <Card.Root class="border border-gray-200">
            <Card.Header class="border-b border-gray-100 pb-4">
              <Card.Title class="text-lg font-medium text-gray-900">Page Views Over Time</Card.Title>
              <Card.Description class="text-sm text-gray-500">{getPeriodLabel(timeRange)}</Card.Description>
            </Card.Header>
            <Card.Content class="pt-6">
              <SimpleLineChart data={chartData} class="h-64" />
            </Card.Content>
          </Card.Root>
        </div>

        <!-- Goals Section -->
        {#if goals.length > 0}
          <div class="mb-12">
            <div class="text-center mb-8">
              <h2 class="text-3xl font-medium text-gray-900 mb-2">Goals</h2>
              <p class="text-gray-500">Measure your conversions for web page visits or custom events</p>
            </div>

            <Card.Root class="border border-gray-200">
              <Card.Header class="border-b border-gray-100 pb-4">
                <div class="flex items-center justify-between">
                  <Card.Title class="text-lg font-medium text-gray-900">Goal Conversions</Card.Title>
                  <button class="text-sm text-gray-500 hover:text-gray-900">Manage goals</button>
                </div>
              </Card.Header>
              <Card.Content class="p-0">
                <div class="overflow-hidden">
                  <!-- Table Header -->
                  <div class="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                    <div class="col-span-6">Goal</div>
                    <div class="col-span-2 text-right">Unique</div>
                    <div class="col-span-2 text-right">Total</div>
                    <div class="col-span-2 text-right">CR</div>
                  </div>
                  
                  <!-- Table Rows -->
                  {#each goals as goal, index}
                    <div class="grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors {index < 3 ? 'bg-gray-50' : ''}">
                      <div class="col-span-6">
                        <code class="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">{goal.goal}</code>
                      </div>
                      <div class="col-span-2 text-right text-sm font-medium text-gray-900">{goal.unique}</div>
                      <div class="col-span-2 text-right text-sm font-medium text-gray-900">{goal.total}</div>
                      <div class="col-span-2 text-right text-sm font-medium text-gray-900">{goal.conversionRate}%</div>
                    </div>
                  {/each}
                </div>
                
                {#if goals.length > 5}
                  <div class="px-6 py-4 border-t border-gray-100 text-center">
                    <button class="text-sm text-gray-500 hover:text-gray-900 uppercase tracking-wide">View All</button>
                  </div>
                {/if}
              </Card.Content>
            </Card.Root>
          </div>
        {/if}

        <!-- Data Tables -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Top Pages -->
          <Card.Root class="border border-gray-200">
            <Card.Header class="border-b border-gray-100 pb-4">
              <Card.Title class="text-base font-medium text-gray-900">Top Pages</Card.Title>
              <Card.Description class="text-sm text-gray-500">{getPeriodLabel(timeRange)}</Card.Description>
            </Card.Header>
            <Card.Content class="pt-6">
              <div class="space-y-4">
                {#each topPages.slice(0, 8) as page}
                  <div class="flex items-center justify-between">
                    <div class="flex-1 min-w-0">
                      <div class="text-sm font-medium text-gray-900 truncate">{page.path}</div>
                      <div class="progress-bar mt-2">
                        <div 
                          class="progress-fill" 
                          style="width: {page.percentage}%"
                        ></div>
                      </div>
                    </div>
                    <div class="ml-4 text-right">
                      <div class="text-sm font-medium text-gray-900">{page.views.toLocaleString()}</div>
                      <div class="text-xs text-gray-500">{page.percentage}%</div>
                    </div>
                  </div>
                {:else}
                  <div class="text-center text-gray-400 py-8 text-sm">No data available</div>
                {/each}
              </div>
            </Card.Content>
          </Card.Root>

          <!-- Top Countries -->
          <Card.Root class="border border-gray-200">
            <Card.Header class="border-b border-gray-100 pb-4">
              <Card.Title class="text-base font-medium text-gray-900">Top Countries</Card.Title>
              <Card.Description class="text-sm text-gray-500">{getPeriodLabel(timeRange)}</Card.Description>
            </Card.Header>
            <Card.Content class="pt-6">
              <div class="space-y-4">
                {#each topCountries.slice(0, 8) as country}
                  <div class="flex items-center justify-between">
                    <div class="flex-1 min-w-0">
                      <div class="text-sm font-medium text-gray-900 truncate">{country.country}</div>
                      <div class="progress-bar mt-2">
                        <div 
                          class="progress-fill" 
                          style="width: {country.percentage}%"
                        ></div>
                      </div>
                    </div>
                    <div class="ml-4 text-right">
                      <div class="text-sm font-medium text-gray-900">{country.visitors.toLocaleString()}</div>
                      <div class="text-xs text-gray-500">{country.percentage}%</div>
                    </div>
                  </div>
                {:else}
                  <div class="text-center text-gray-400 py-8 text-sm">No data available</div>
                {/each}
              </div>
            </Card.Content>
          </Card.Root>

          <!-- Top Referrers -->
          <Card.Root class="border border-gray-200">
            <Card.Header class="border-b border-gray-100 pb-4">
              <Card.Title class="text-base font-medium text-gray-900">Top Referrers</Card.Title>
              <Card.Description class="text-sm text-gray-500">{getPeriodLabel(timeRange)}</Card.Description>
            </Card.Header>
            <Card.Content class="pt-6">
              <div class="space-y-4">
                {#each topReferrers.slice(0, 8) as referrer}
                  <div class="flex items-center justify-between">
                    <div class="flex-1 min-w-0">
                      <div class="text-sm font-medium text-gray-900 truncate">{referrer.source}</div>
                      <div class="progress-bar mt-2">
                        <div 
                          class="progress-fill" 
                          style="width: {referrer.percentage}%"
                        ></div>
                      </div>
                    </div>
                    <div class="ml-4 text-right">
                      <div class="text-sm font-medium text-gray-900">{referrer.visitors.toLocaleString()}</div>
                      <div class="text-xs text-gray-500">{referrer.percentage}%</div>
                    </div>
                  </div>
                {:else}
                  <div class="text-center text-gray-400 py-8 text-sm">No data available</div>
                {/each}
              </div>
            </Card.Content>
          </Card.Root>
        </div>

        <!-- Setup Instructions -->
        <div class="mt-12 border border-gray-200 rounded-lg p-6">
          <h3 class="text-base font-medium text-gray-900 mb-4">Setup Tracking</h3>
          <p class="text-sm text-gray-600 mb-4">Add this script to your website's HTML:</p>
          <code class="block bg-gray-50 border border-gray-200 p-4 rounded text-sm font-mono text-gray-900">
            &lt;script src="{API_BASE}/tracker.js" defer&gt;&lt;/script&gt;
          </code>
          <p class="text-xs text-gray-500 mt-2">
            Replace localhost:3001 with your production domain.
          </p>
        </div>
      {:else}
        <!-- Empty State -->
        <div class="text-center py-16">
          <div class="max-w-md mx-auto">
            <h3 class="text-lg font-medium text-gray-900 mb-2">No websites found</h3>
            <p class="text-gray-500 mb-6 text-sm">
              Add your first website to start collecting analytics.
            </p>
            <button
              on:click={() => showWebsiteDropdown = true}
              class="btn-primary"
            >
              Add Website
            </button>
          </div>
        </div>
      {/if}
    </main>
  </div>
{/if}
