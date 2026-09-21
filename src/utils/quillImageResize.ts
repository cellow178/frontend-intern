import Quill from 'quill'

export class CustomImageResize {
  quill: Quill
  overlay: HTMLElement | null = null
  toolbar: HTMLElement | null = null
  targetEl: HTMLElement | null = null
  dragStartX = 0
  dragStartWidth = 0

  constructor(quill: Quill) {
    this.quill = quill
    this.quill.root.addEventListener('click', this.handleClick)
  }

  handleClick = (evt: MouseEvent) => {
    const target = evt.target as HTMLElement

    if (target && target.tagName === 'IMG') {
      this.selectElement(target)
      return
    }

    const iframe = target.tagName === 'IFRAME' ? target : target.querySelector('iframe')
    if (iframe) {
      this.selectElement(iframe as HTMLElement)
      return
    }

    this.hideOverlay()
  }

  selectElement(el: HTMLElement) {
    this.hideOverlay()
    this.targetEl = el

    // Overlay Box Border
    this.overlay = document.createElement('div')
    this.overlay.style.position = 'absolute'
    this.overlay.style.border = '1px dashed #0066cc'
    this.overlay.style.boxSizing = 'border-box'
    this.overlay.style.pointerEvents = 'none'

    // Buat Titik Handle Drag (Ukuran diperbesar sedikit agar mudah disentuh di HP)
    if (el.tagName === 'IMG') {
      const handle = document.createElement('div')
      handle.style.position = 'absolute'
      handle.style.right = '-8px'
      handle.style.bottom = '-8px'
      handle.style.width = '16px'
      handle.style.height = '16px'
      handle.style.backgroundColor = '#0066cc'
      handle.style.border = '2px solid #ffffff'
      handle.style.borderRadius = '50%'
      handle.style.cursor = 'nwse-resize'
      handle.style.pointerEvents = 'auto'
      handle.style.touchAction = 'none'

      // Event Mouse (Desktop)
      handle.addEventListener('mousedown', this.handleMouseDown)

      // Event Touch (Mobile)
      handle.addEventListener('touchstart', this.handleTouchStart, { passive: false })

      this.overlay.appendChild(handle)
    }

    // Floating Toolbar Alignment
    this.toolbar = document.createElement('div')
    this.toolbar.style.position = 'absolute'
    this.toolbar.style.top = '-38px'
    this.toolbar.style.left = '50%'
    this.toolbar.style.transform = 'translateX(-50%)'
    this.toolbar.style.display = 'flex'
    this.toolbar.style.gap = '4px'
    this.toolbar.style.backgroundColor = '#1e293b'
    this.toolbar.style.padding = '4px'
    this.toolbar.style.borderRadius = '6px'
    this.toolbar.style.zIndex = '10'
    this.toolbar.style.pointerEvents = 'auto'

    const buttons = [
      { label: 'Left', align: '', margin: '0 auto 0 0' },
      { label: 'Center', align: 'center', margin: '0 auto' },
      { label: 'Right', align: 'right', margin: '0 0 0 auto' },
    ]

    buttons.forEach((btn) => {
      const b = document.createElement('button')
      b.innerText = btn.label
      b.type = 'button'
      b.style.color = '#fff'
      b.style.fontSize = '12px'
      b.style.padding = '2px 8px'
      b.style.border = 'none'
      b.style.borderRadius = '4px'
      b.style.cursor = 'pointer'
      b.style.backgroundColor = '#334155'

      b.addEventListener('click', (e) => {
        e.stopPropagation()
        this.setAlignment(btn.align, btn.margin)
      })

      this.toolbar?.appendChild(b)
    })

    this.overlay.appendChild(this.toolbar)
    this.quill.root.parentNode?.appendChild(this.overlay)
    this.positionOverlay()
  }

  // --- LOGIKA RESIZE DESKTOP (MOUSE) ---
  handleMouseDown = (e: MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    if (!this.targetEl) return
    this.dragStartX = e.clientX
    this.dragStartWidth = this.targetEl.clientWidth

    document.addEventListener('mousemove', this.handleMouseMove)
    document.addEventListener('mouseup', this.handleMouseUp)
  }

  handleMouseMove = (e: MouseEvent) => {
    if (!this.targetEl) return
    const deltaX = e.clientX - this.dragStartX
    this.applyNewWidth(deltaX)
  }

  handleMouseUp = () => {
    document.removeEventListener('mousemove', this.handleMouseMove)
    document.removeEventListener('mouseup', this.handleMouseUp)
    this.quill.emitter.emit('text-change')
  }

  // --- LOGIKA RESIZE MOBILE (TOUCH) ---
  handleTouchStart = (e: TouchEvent) => {
    e.stopPropagation()
    if (e.cancelable) e.preventDefault()

    const touch = e.touches[0]
    if (!this.targetEl || !touch) return

    this.dragStartX = touch.clientX
    this.dragStartWidth = this.targetEl.clientWidth

    document.addEventListener('touchmove', this.handleTouchMove, { passive: false })
    document.addEventListener('touchend', this.handleTouchEnd)
  }

  handleTouchMove = (e: TouchEvent) => {
    if (e.cancelable) e.preventDefault()

    const touch = e.touches[0]
    if (!this.targetEl || !touch) return

    const deltaX = touch.clientX - this.dragStartX
    this.applyNewWidth(deltaX)
  }

  handleTouchEnd = () => {
    document.removeEventListener('touchmove', this.handleTouchMove)
    document.removeEventListener('touchend', this.handleTouchEnd)
    this.quill.emitter.emit('text-change')
  }

  applyNewWidth(deltaX: number) {
    if (!this.targetEl) return
    const newWidth = Math.max(50, this.dragStartWidth + deltaX)

    this.targetEl.style.width = `${newWidth}px`
    this.targetEl.style.height = 'auto'

    const blot = Quill.find(this.targetEl) as any
    if (blot) {
      blot.format('style', this.targetEl.getAttribute('style') || '')
    }

    this.positionOverlay()
  }

  setAlignment(alignValue: string, marginStyle: string) {
    if (!this.targetEl) return

    const blot = Quill.find(this.targetEl) as any

    if (this.targetEl.tagName === 'IFRAME') {
      if (blot) {
        const index = this.quill.getIndex(blot)
        this.quill.setSelection(index, 1)
        this.quill.format('align', alignValue)
      }
    } else {
      this.targetEl.style.display = 'block'
      this.targetEl.style.margin = marginStyle
      if (blot) {
        blot.format('style', this.targetEl.getAttribute('style') || '')
      }
    }

    this.quill.emitter.emit('text-change')
    setTimeout(() => this.positionOverlay(), 50)
  }

  positionOverlay() {
    if (!this.overlay || !this.targetEl) return
    const parentRect = (this.quill.root.parentNode as HTMLElement).getBoundingClientRect()
    const elRect = this.targetEl.getBoundingClientRect()

    this.overlay.style.left = `${elRect.left - parentRect.left}px`
    this.overlay.style.top = `${elRect.top - parentRect.top}px`
    this.overlay.style.width = `${elRect.width}px`
    this.overlay.style.height = `${elRect.height}px`
  }

  hideOverlay() {
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay)
    }
    this.overlay = null
    this.toolbar = null
    this.targetEl = null
  }
}
