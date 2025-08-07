<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { browser } from '$app/environment';
  
  let isAuthenticated = false;
  let loading = true;
  let user: { email: string } | null = null;

  async function checkAuth() {
    if (!browser) return;
    
    const token = localStorage.getItem('arjuna_token');
    if (!token) {
      loading = false;
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/auth/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        isAuthenticated = true;
        user = data.user;
      } else {
        localStorage.removeItem('arjuna_token');
        isAuthenticated = false;
        user = null;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('arjuna_token');
      isAuthenticated = false;
      user = null;
    } finally {
      loading = false;
    }
  }

  function logout() {
    if (browser) {
      localStorage.removeItem('arjuna_token');
    }
    isAuthenticated = false;
    user = null;
    goto('/login');
  }

  onMount(() => {
    checkAuth();
  });

  // Reactive statement to handle route protection
  $: if (browser && !loading) {
    const isLoginPage = $page.route.id === '/login';
    
    if (!isAuthenticated && !isLoginPage) {
      goto('/login');
    } else if (isAuthenticated && isLoginPage) {
      goto('/');
    }
  }
</script>

{#if loading}
  <!-- Loading screen -->
  <div class="min-h-screen bg-neutral-50 flex items-center justify-center">
    <div class="text-center">
      <div class="inline-flex items-center justify-center w-12 h-12 bg-blue-500 rounded-xl mb-4">
        <svg class="w-6 h-6 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <div class="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent mx-auto"></div>
    </div>
  </div>
{:else if $page.route.id === '/login'}
  <!-- Login page - no layout wrapper -->
  <slot />
{:else if isAuthenticated}
  <!-- Main app layout -->
  <div class="min-h-screen bg-neutral-50">
    <!-- Top Navigation -->
    <nav class="bg-white border-b border-neutral-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo/Brand -->
          <div class="flex items-center">
            <div class="flex items-center">
              <div class="inline-flex items-center justify-center w-8 h-8 bg-blue-500 rounded-lg mr-3">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h1 class="text-lg font-semibold text-neutral-900">Analytics</h1>
            </div>
          </div>

          <!-- User Menu -->
          <div class="flex items-center space-x-4">
            <div class="flex items-center text-sm text-neutral-600">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {user?.email}
            </div>
            <button
              on:click={logout}
              class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <slot />
    </main>
  </div>
{:else}
  <!-- Fallback - should not reach here due to reactive statement -->
  <div class="min-h-screen bg-neutral-50 flex items-center justify-center">
    <div class="text-center">
      <p class="text-neutral-600">Redirecting to login...</p>
    </div>
  </div>
{/if}