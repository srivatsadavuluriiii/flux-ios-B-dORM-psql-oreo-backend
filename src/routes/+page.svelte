<script lang="ts">
  import { onMount } from 'svelte';
  
  let healthData: any = null;
  let loading = true;
  
  onMount(async () => {
    try {
      const response = await fetch('/api/health');
      healthData = await response.json();
    } catch (error) {
      console.error('Failed to fetch health data:', error);
    } finally {
      loading = false;
    }
  });
</script>

<svelte:head>
  <title>Flux Backend</title>
  <meta name="description" content="Next-generation expense tracking backend" />
</svelte:head>

<main class="container">
  <header>
    <h1>🚀 Flux Backend</h1>
    <p>Next-generation expense tracking backend with AI, IoT, and blockchain integration</p>
  </header>

  <section class="status">
    <h2>System Status</h2>
    {#if loading}
      <p>Loading system status...</p>
    {:else if healthData}
      <div class="health-card {healthData.data.status}">
        <h3>Status: {healthData.data.status.toUpperCase()}</h3>
        <p><strong>Service:</strong> {healthData.data.service}</p>
        <p><strong>Version:</strong> {healthData.data.version}</p>
        <p><strong>Environment:</strong> {healthData.data.environment}</p>
        <p><strong>Uptime:</strong> {Math.round(healthData.data.system.uptime)}s</p>
        <p><strong>Response Time:</strong> {healthData.responseTime}ms</p>
      </div>
      
      <div class="development">
        <h3>Development Progress</h3>
        <p><strong>Current Phase:</strong> {healthData.data.development.phase}</p>
        <p><strong>Completion:</strong> {healthData.data.development.completion}</p>
        <p><strong>Next Phase:</strong> {healthData.data.development.nextPhase}</p>
      </div>
    {:else}
      <div class="health-card unhealthy">
        <h3>Status: UNAVAILABLE</h3>
        <p>Unable to fetch system status</p>
      </div>
    {/if}
  </section>

  <section class="api-info">
    <h2>API Endpoints</h2>
    <ul>
      <li><code>GET /api/health</code> - System health check</li>
      <li><code>HEAD /api/health</code> - Simple health check</li>
    </ul>
  </section>
</main>

<style>
  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  header {
    text-align: center;
    margin-bottom: 3rem;
  }

  h1 {
    color: #2563eb;
    margin-bottom: 0.5rem;
  }

  .health-card {
    background: #f8fafc;
    padding: 1.5rem;
    border-radius: 8px;
    border-left: 4px solid #10b981;
    margin-bottom: 1rem;
  }

  .health-card.unhealthy {
    border-left-color: #ef4444;
    background: #fef2f2;
  }

  .development {
    background: #eff6ff;
    padding: 1.5rem;
    border-radius: 8px;
    border-left: 4px solid #3b82f6;
  }

  .api-info {
    margin-top: 2rem;
  }

  code {
    background: #f1f5f9;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-family: 'JetBrains Mono', monospace;
  }

  ul {
    list-style: none;
    padding: 0;
  }

  li {
    margin-bottom: 0.5rem;
  }
</style> 