<script lang="ts">
  import { cn } from "$lib/utils.js";
  import { ChevronDown } from "lucide-svelte";
  
  export let className: string | undefined = undefined;
  export { className as class };
  export let disabled: boolean = false;
  
  let isOpen = false;
  
  function toggleOpen() {
    if (!disabled) {
      isOpen = !isOpen;
    }
  }
</script>

<button
  type="button"
  class={cn(
    "flex h-10 w-full items-center justify-between rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    className
  )}
  {disabled}
  on:click={toggleOpen}
  {...$$restProps}
>
  <slot />
  <ChevronDown class="h-4 w-4 opacity-50" />
</button>