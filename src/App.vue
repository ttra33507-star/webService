<script setup lang="ts">
import { RouterView } from 'vue-router';
import ChatSupportButton from './components/layout/ChatSupportButton.vue';
import MainFooter from './components/layout/MainFooter.vue';
import MainHeader from './components/layout/MainHeader.vue';
</script>

<template>
  <div class="flex min-h-screen flex-col bg-white text-slate-900 font-body">
    <MainHeader />
    <main class="flex-1">
      <RouterView />
    </main>
    <MainFooter />
    <ChatSupportButton />
  </div>
</template>
