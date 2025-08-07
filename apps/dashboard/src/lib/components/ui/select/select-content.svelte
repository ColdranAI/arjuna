<script lang="ts">
  import { cn } from "$lib/utils.js";
  
  export let className: string | undefined = undefined;
  export { className as class };
</script>

<div
  class={cn(
    "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border border-neutral-200 bg-white text-neutral-950 shadow-md animate-in fade-in-0 zoom-in-95",
    className
  )}
  {...$$restProps}
>
  <div class="p-1">
    <slot />
  </div>
</div>