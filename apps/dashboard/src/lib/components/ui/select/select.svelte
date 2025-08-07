<script lang="ts">
  import { cn } from "$lib/utils.js";
  
  export let value: string = "";
  export let className: string | undefined = undefined;
  export { className as class };
</script>

<div class={cn("relative", className)} {...$$restProps}>
  <slot />
</div>