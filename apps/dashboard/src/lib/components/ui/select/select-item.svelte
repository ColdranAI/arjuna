<script lang="ts">
  import { cn } from "$lib/utils.js";
  
  export let value: string;
  export let className: string | undefined = undefined;
  export { className as class };
  export let disabled: boolean = false;
  
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
  
  function handleClick() {
    if (!disabled) {
      dispatch('select', { value });
    }
  }
</script>

<div
  class={cn(
    "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-neutral-100 focus:bg-neutral-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
    disabled && "pointer-events-none opacity-50",
    className
  )}
  role="option"
  tabindex="-1"
  on:click={handleClick}
  on:keydown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
  {...$$restProps}
>
  <slot />
</div>