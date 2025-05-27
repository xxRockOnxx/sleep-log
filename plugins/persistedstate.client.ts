import type { Pinia } from "pinia";
import { setActivePinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import { defineNuxtPlugin } from "#app";

export default defineNuxtPlugin((nuxtApp) => {
  const pinia = nuxtApp.$pinia as Pinia | undefined;
  if (pinia) {
    pinia.use(piniaPluginPersistedstate);
  } else {
    // Fallback for older Nuxt versions or if $pinia is not yet available
    // This might indicate a setup issue if $pinia is expected
    console.warn(
      "Pinia instance not found on nuxtApp.$pinia. Attempting to use setActivePinia.",
    );
    // const newPinia = createPinia(); // This would create a new instance, which might not be what we want
    // newPinia.use(piniaPluginPersistedstate);
    // nuxtApp.vueApp.use(newPinia);
    // setActivePinia(newPinia);
    // This part needs careful consideration based on Nuxt version and Pinia setup.
    // For Nuxt 3 with @pinia/nuxt, $pinia should be available.
    // If issues persist, ensure @pinia/nuxt is correctly installed and configured.
  }
});
