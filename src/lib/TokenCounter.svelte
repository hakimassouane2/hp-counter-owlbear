<script lang="ts">
  import type { Image, Text } from "@owlbear-rodeo/sdk";
  import OBR from "@owlbear-rodeo/sdk";
  import { onMount } from "svelte";
  import { attachCounterToItemWithNumber } from "./common";
  import { getPluginId } from "./getPluginId";
  import { isPlainObject } from "./isPlainObject";

  let numberInputValue: number = 0;
  let isVisible = true;
  let hasToggleVisibilityPermission = false;

  onMount(async () => {
    const role = await OBR.player.getRole();
    hasToggleVisibilityPermission = role === "GM";
    const itemsAndCounters = await getSelectedItemsAndCounters();
    let visibleCount = 0;
    let itemCount = 0;
    // when first appear, calculate whether visibility button should show "visible" or "hidden"
    for (const { item, counter } of itemsAndCounters) {
      if (!counter) continue;
      if (item.visible) itemCount++;
      const numberFromCounter = parseInt(counter.text.plainText);
      numberInputValue = numberFromCounter;
      if (counter.visible) visibleCount++;
    }
    isVisible = visibleCount > itemCount / 2;
  });

  async function getSelectedItemsAndCounters(): Promise<
    { item: Image; counter: Text }[]
  > {
    let result: { item: Image; counter: Text }[] = [];

    // get selection
    const selection = await OBR.player.getSelection();
    if (!selection) return result;

    // get selected items
    const items = await OBR.scene.items.getItems<Image>(selection);
    if (!items) return result;

    // get counters for all items
    const tokenCounters = await OBR.scene.items.getItems<Text>((item) => {
      const metadata = item.metadata[getPluginId("metadata")];
      return Boolean(isPlainObject(metadata) && metadata.enabled);
    });

    return items.map((item) => {
      return {
        item,
        counter: tokenCounters.find((c) => c.attachedTo === item.id),
      };
    });
  }

  async function updateCountersWithNumber(n: number) {
    const itemsAndCounters = await getSelectedItemsAndCounters();

    for (const { item, counter } of itemsAndCounters) {
      // Find the counter attached to this item
      if (!counter) {
        attachCounterToItemWithNumber(item, n);
      } else {
        OBR.scene.items.updateItems([counter], (counterItems) => {
          counterItems[0].text.plainText = `${n}`;
        });
      }
    }
  }

  async function addOne() {
    numberInputValue += 1;
    updateCountersWithNumber(numberInputValue);
  }

  async function subtractOne() {
    numberInputValue -= 1;
    updateCountersWithNumber(numberInputValue);
  }

  type Color = "red" | "orange" | "yellow" | "green" | "blue" | "purple";

  async function setColor(color: Color) {
    const itemsAndCounters = await getSelectedItemsAndCounters();
    for (const { counter } of itemsAndCounters) {
      if (!counter) {
        continue;
      } else {
        OBR.scene.items.updateItems([counter], (items) => {
          items[0].text.style.fillColor = color;
          items[0].text.style.strokeColor =
            color === "yellow" ? "black" : "white";
        });
      }
    }
  }

  async function toggleVisibility() {
    const itemsAndCounters = await getSelectedItemsAndCounters();
    let atLeastOneItemChanged = false;
    for (const { item, counter } of itemsAndCounters) {
      if (!item.visible || !counter) continue;
      atLeastOneItemChanged = true;
      OBR.scene.items.updateItems([counter], (items) => {
        items[0].visible = !isVisible;
      });
    }
    if (atLeastOneItemChanged) {
      isVisible = !isVisible;
    }
  }
  
  async function onInput(e: Event) {    
    const inputValue = parseInt((e.target as HTMLInputElement).value);
    const isAddition = /^[\+]\d+$/.test((e.target as HTMLInputElement).value);
    const isSubstraction = /^[\-]\d+$/.test((e.target as HTMLInputElement).value);

    const itemsAndCounters = await getSelectedItemsAndCounters();
    for (const { item, counter } of itemsAndCounters) {
      if (!counter) {
         attachCounterToItemWithNumber(item, inputValue);
      } else {
        numberInputValue = isAddition ? numberInputValue + inputValue : isSubstraction ? numberInputValue + inputValue : inputValue;
        OBR.scene.items.updateItems([counter], (items) => {
          items[0].text.plainText = `${numberInputValue}`;
        });

      }
    }
  }

  function onFocus(e: Event) {
    (e.target as HTMLInputElement).select();
  }
</script>

<div
  class="grid grid-cols-6 grid-rows-1 text-white h-[40px] gap-1 text-2xl p-1 "
  style="font-family: 'Roboto', sans-serif;"
>
  <button
    class="rounded-sm active:bg-teal-700 rounded-lg"
    style="background-color: rgb(239 68 68);"
    on:click={() => subtractOne()}
  >
    -
  </button>
  <input
    type="text"
    class="col-span-2 text-black text-center rounded-lg"
    style="background-color: rgba(255, 0, 0, 0.4); color: white; border: 1px solid rgb(229, 231, 235);"
    class:col-span-4={!hasToggleVisibilityPermission}
    value={numberInputValue}
    on:focus={onFocus}
    on:keydown={(e) => ["e", "E"].includes(e.key) && e.preventDefault()}
    on:keydown={(event) => ["Enter"].includes(event.key) && onInput(event)}
  />
  <button
    class="bg-teal-500 rounded-sm active:bg-teal-700 rounded-lg"
    on:click={() => addOne()}
  >
    +
  </button>
  <button
    class="bg-red-500 swatch"
    on:click={() => setColor("red")}
    aria-label="red"
  />
  <button
    class="bg-green-500 swatch"
    on:click={() => setColor("green")}
    aria-label="green"
  />

</div>

<style lang="postcss">
  .swatch {
    @apply rounded-full w-5 h-5 self-center justify-self-center active:opacity-50;
  }
</style>
