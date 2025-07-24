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

<div class="min-h-screen flex items-center justify-center bg-white px-4">
  <div class="max-w-sm w-full">
    <div class="text-center mb-8">
      <h1 class="text-2xl font-medium text-gray-900 mb-2">Analytics</h1>
      <p class="text-sm text-gray-500">Sign in to your dashboard</p>
    </div>
    
    <form class="space-y-6" on:submit|preventDefault={handleLogin}>
      <div>
        <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autocomplete="email"
          required
          class="input"
          placeholder="Enter your email"
          bind:value={email}
          on:keydown={handleKeydown}
          disabled={loading}
        />
      </div>
      
      <div>
        <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autocomplete="current-password"
          required
          class="input"
          placeholder="Enter your password"
          bind:value={password}
          on:keydown={handleKeydown}
          disabled={loading}
        />
      </div>

      {#if error}
        <div class="border border-gray-200 bg-gray-50 rounded p-3">
          <p class="text-sm text-gray-900">{error}</p>
        </div>
      {/if}

      <button
        type="submit"
        class="btn-primary w-full"
        disabled={loading}
      >
        {#if loading}
          <div class="flex items-center justify-center">
            <div class="w-4 h-4 border-2 border-gray-300 border-t-white rounded-full animate-spin mr-2"></div>
            Signing in...
          </div>
        {:else}
          Sign in
        {/if}
      </button>
    </form>
  </div>
</div> 