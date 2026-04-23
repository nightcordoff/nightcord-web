// Scroll reveal using IntersectionObserver
export function useScrollReveal() {
  let observer: IntersectionObserver | null = null

  function init() {
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed')
          observer!.unobserve(entry.target)
        }
      })
    }, { threshold: 0.12 })

    document.querySelectorAll('[data-reveal], [data-stagger]').forEach((el) => {
      observer!.observe(el)
    })
  }

  function destroy() {
    observer?.disconnect()
    observer = null
  }

  return { init, destroy }
}
