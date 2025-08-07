<script lang="ts">
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  
  let email = '';
  let password = '';
  let loading = false;
  let error = '';

  async function handleLogin() {
    if (!email || !password) {
      error = 'Please fill in all fields';
      return;
    }

    loading = true;
    error = '';

    try {
      const response = await fetch('http://localhost:3001/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (browser) {
          localStorage.setItem('arjuna_token', data.token);
        }
        goto('/');
      } else {
        error = data.error || 'Login failed';
      }
    } catch (err) {
      error = 'Network error. Please try again.';
      console.error('Login error:', err);
    } finally {
      loading = false;
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      handleLogin();
    }
  }
</script>

<svelte:head>
  <title>Sign In - Analytics</title>
</svelte:head>

<div class="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
  <div class="w-full max-w-sm">
    <!-- Logo/Brand -->
    <div class="text-center mb-8">
      <div class="inline-flex items-center justify-center w-12 h-12 bg-blue-500 rounded-xl mb-4">
        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <h1 class="text-2xl font-semibold text-neutral-900 mb-2">Welcome back</h1>
      <p class="text-sm text-neutral-500">Sign in to your analytics dashboard</p>
    </div>
    
    <!-- Login Form -->
    <div class="card p-6">
      <form class="space-y-5" on:submit|preventDefault={handleLogin}>
        <div>
          <label for="email" class="block text-sm font-medium text-neutral-700 mb-2">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autocomplete="email"
            required
            class="input focus-ring"
            placeholder="Enter your email"
            bind:value={email}
            on:keydown={handleKeydown}
            disabled={loading}
          />
        </div>
        
        <div>
          <label for="password" class="block text-sm font-medium text-neutral-700 mb-2">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autocomplete="current-password"
            required
            class="input focus-ring"
            placeholder="Enter your password"
            bind:value={password}
            on:keydown={handleKeydown}
            disabled={loading}
          />
        </div>

        {#if error}
          <div class="bg-red-50 border border-red-200 rounded-lg p-3 fade-in">
            <div class="flex items-center">
              <svg class="w-4 h-4 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p class="text-sm text-red-700">{error}</p>
            </div>
          </div>
        {/if}

        <button
          type="submit"
          class="btn btn-primary w-full focus-ring"
          disabled={loading}
        >
          {#if loading}
            <div class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Signing in...
            </div>
          {:else}
            Sign in
          {/if}
        </button>
      </form>
    </div>

    <!-- Footer -->
    <div class="text-center mt-6">
      <p class="text-xs text-neutral-400">
        Privacy-first analytics platform
      </p>
    </div>
  </div>
</div>

<style>
  /* Additional component-specific styles */
  .card {
    backdrop-filter: blur(10px);
  }
</style>