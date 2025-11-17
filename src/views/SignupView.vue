<template>
  <section class="flex min-h-screen items-center justify-center bg-white px-4 py-16 text-slate-900">
    <div class="w-full max-w-md rounded-3xl border border-slate-900/80 bg-white/70 p-8 shadow-2xl">
      <header class="text-center">
        <p class="text-xs font-semibold uppercase tracking-[0.35em] text-[#0c86c3]">Create account</p>
        <h1 class="mt-3 text-3xl font-semibold text-slate-900">Sign up</h1>
        <p class="mt-3 text-sm text-slate-900">Create an account to start using C4 Tech Hub services.</p>
      </header>

      <form class="mt-8 space-y-5" @submit.prevent="handleSubmit">
        <label class="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Full name
          <input v-model="name" type="text" placeholder="Your full name" class="rounded-xl border border-slate-800 bg-white/70 px-4 py-3 text-slate-900" required />
        </label>

        <label class="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Email
          <input v-model="email" type="email" placeholder="you@example.com" class="rounded-xl border border-slate-800 bg-white/70 px-4 py-3 text-slate-900" required />
        </label>

        <label class="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Password
          <input v-model="password" type="password" placeholder="********" class="rounded-xl border border-slate-800 bg-white/70 px-4 py-3 text-slate-900" required />
        </label>

        <label class="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Confirm password
          <input v-model="confirmPassword" type="password" placeholder="Confirm password" class="rounded-xl border border-slate-800 bg-white/70 px-4 py-3 text-slate-900" required />
        </label>

        <button type="submit" class="w-full rounded-full bg-[#0c86c3] px-5 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white" :disabled="isSubmitting">
          {{ isSubmitting ? 'Creating…' : 'Create account' }}
        </button>
      </form>

      <p v-if="message" class="mt-5 rounded-xl border border-[#0c86c3]/30 bg-[#0c86c3]/10 px-4 py-3 text-center text-sm text-[#0c86c3]">{{ message }}</p>

      <p v-if="error" class="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-center text-sm text-red-200">{{ error }}</p>

      <button
        type="button"
        class="mt-6 w-full rounded-full border border-[#0c86c3] px-5 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-[#0c86c3] transition hover:bg-[#0c86c3] hover:text-white"
        @click="goToSignIn"
      >
        Sign in
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { register as apiRegister } from '../services/authService'

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const isSubmitting = ref(false)
const message = ref('')
const error = ref('')

const router = useRouter()

const goToSignIn = () => {
  router.push({ path: '/signin', query: { redirect: '/' } })
}

const handleSubmit = async () => {
  if (isSubmitting.value) return
  error.value = ''
  message.value = ''

  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match.'
    return
  }

  isSubmitting.value = true
  try {
    await apiRegister({ name: name.value.trim(), email: email.value.trim(), password: password.value, password_confirmation: confirmPassword.value })
    message.value = 'Registration successful. Please check your email to confirm your account.'
    // optional: navigate to a thank-you or login page
    setTimeout(() => router.push('/signin'), 2200)
  } catch (err: any) {
    error.value = err?.message || 'Unable to register. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
/* keep minimal styling; project uses utility classes */
</style>
