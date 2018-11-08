const Modal = (() => {
  const _instaces = []

  class Modal {
    constructor(element, config) {
      this.el = element || document.createElement('div')
      this._backdrop = null
      this._config = this._getConfig(config)
      this._content = this.el.querySelector('.modal-content') || this.el
      this._loader = null
      this._scroll = {}
      
      // Delegated functions
      this._hide = this.hide.bind(this)
    }

    show() {
      let body = document.body
      this._scroll = {
        top: window.scrollY,
        left: window.scrollX
      }

      body.classList.add('modal-open')

      /* Scroll lock */
      body.style.position = 'fixed'
      body.style.left = '0'
      body.style.right = '0'
      body.style.top = (-this._scroll.top) + 'px'
      body.style.left = (-this._scroll.left) + 'px'

      let all = null
      let _show = document.createEvent('Event')
      let _shown = document.createEvent('Event')

      _show.initEvent('show', false, false)
      _shown.initEvent('shown', false, false)

      this.el.dispatchEvent(_show)

      if (this._config.href) {
        this._loader && this._loader.abort()

        let _l = this._load(this._config.href, this._config.selector)
        this._loader = _l.xhr

        all = Promise.all([
          this._showBackdrop(),
          _l.promise,
        ]).then((text) => {
          if (!this._config.selector)
            this._content.innerHTML = text
          else {
            let div = document.createElement('div')
            div.innerHTML = text

            let c = div.querySelector(this._config.selector)

            this._content.innerHTML = c ? c.innerHTML : ''
          }

          return this._showElement()
        })
      } else
        all = Promise.all([this._showBackdrop(), this._showElement()])

      all.then(() => this.el && this.el.dispatchEvent(_shown))

      return all
    }

    hide(e=null) {
      let result = !e || e && e.target === this.el

      Array.from(this.el.querySelectorAll('[data-dismiss="modal"]')).forEach(el => {
        this._off('click', el)

        if (e && (e.target === el || el.contains(e.target)))
          result = true
      })

      if (!result || !this.el.classList.contains('show')) {
        let rejected = Promise.reject()
        rejected.catch(()=>{})

        return rejected
      }

      e && e.target && (e.target.tagName === 'A' || e.target.tagName === 'AREA') && e.preventDefault() 

      let _hide = document.createEvent('Event')
      _hide.initEvent('hide', false, false)

      this.el.dispatchEvent(_hide)

      let all = Promise.all([this._hideModal(), this._hideBackdrop()])

      all.then(() => {
        this.clear()

        let _hidden = document.createEvent('Event')
        _hidden.initEvent('hidden', false, false)

        this.el.dispatchEvent(_hidden)
      })

      return all
    }

    _load(url, selector) {
      let xhr = new XMLHttpRequest()

      return {
        promise: new Promise(function (resolve, reject) {
          let xhr = new XMLHttpRequest()

          xhr.onload = () => {
            if (xhr.status === 200) {
              resolve(xhr.responseText)
            } else
              reject(new Error(xhr.statusText))
          }

          xhr.onerror = () => reject(new Error(xhr.statusText))

          xhr.open('GET', url, true)
          xhr.send()
        }),
        xhr: xhr
      }
    }

    _showElement() {
      return new Promise((resolve, reject) => {
        this.el.classList.remove('show')
        this.el.style.display = 'block'
        this.el.scrollTop = 0

        Array.from(this.el.querySelectorAll('[data-dismiss="modal"]')).forEach(el => {
          this._off('click', el)
          this._on('click', el, this._hide)
        })

        this._on('click', this.el, this._hide)
        this._off('transitionend', this.el)

        if (this.el.classList.contains('fade')) {
          this.el.offsetHeight
          this._on('transitionend', this.el, resolve)
        } else {
          resolve()
        }

        this.el.classList.add('show')
      })
    }

    _showBackdrop() {
      return new Promise((resolve, reject) => {
        this._backdrop = this._backdrop || document.createElement('div')
        this._backdrop.classList.remove('show', 'fade')
        this._backdrop.classList.add('modal-backdrop')

        this._off('transitionend', this._backdrop)

        document.body.appendChild(this._backdrop)

        if (this.el.classList.contains('fade')) {
          this._backdrop.classList.add('fade')
          this._backdrop.offsetHeight
          this._on('transitionend', this._backdrop, resolve)
        } else {
          resolve()
        }

        this._backdrop.classList.add('show')
      })
    }

    _hideModal() {
      return new Promise((resolve, reject) => {
        this._off('transitionend', this.el)

        if (this.el.classList.contains('fade')) {
          this._on('transitionend', this.el, resolve)
        } else {
          resolve()
        }

        this.el.classList.remove('show')
      })
    }

    _hideBackdrop() {
      return new Promise((resolve, reject) => {
        this._backdrop.classList.remove('show')

        resolve()
      })
    }

    set config(config) {
      this._config = this._getConfig(config)
    }

    _getConfig(config={}) {
      if (config.href) {
        let matches = config.href.match(/^([^#]*)(#[^?]*)?(\?.*)?$/)

        if (matches.length) {
          matches.shift()
          config.selector = matches[1]

          matches.splice(1, 1)
          config.href = matches.filter(a => a || '').join('')
        }
      }

      return config
    }

    _on(event, el, func) {
      el._e = el._e || {}
      el._e[event] = el._e[event] || []

      el.addEventListener(event, func)
      el._e[event].push(func)
    }

    _off(event, el) {
      if (!el || !el._e || !el._e[event]) return;

      el._e[event].forEach(f => {
        el.removeEventListener(event, f)
      })

      delete el._e[event]
    }

    _reject(promise, target, event) {
      if (promise) {
        promise.reject && promise.reject()
        promise.resolve && target.removeEventListener(event, promise.resolve)
        promise = null
      }
    }

    clear() {
      let body = document.body

      Array.from(this.el.querySelectorAll('[data-dismiss="modal"]')).forEach(el => el.removeEventListener('click', this._hide))

      this._off('click', this.el)
      this._off('transitionend', this.el)
      this._off('transitionend', this._backdrop)

      this._backdrop && document.body.removeChild(this._backdrop)
      this._backdrop = null

      this.el.classList.remove('show')
      this.el.style.display = 'none'

      body.classList.remove('modal-open')

      /* Release scroll lock */
      body.style.position = ''
      body.style.left = ''
      body.style.right = ''
      body.style.top = ''

      if (this._scroll.top !== undefined && this._scroll.left !== undefined)
        window.scrollTo(this._scroll.left, this._scroll.top)

      this._scroll = {}

      return this
    }

    dispose() {
      this.clear()
      this.el = null

      return this
    }

    static instance(element) {
      return element._modal
    }

    static get instances() {
      return _instaces
    }

    static create(element, config) {
      let modal = element._modal || new Modal(element, config) 

      if (!element._modal) {
        element._modal = modal
        _instaces.push(modal)
      } else
        modal.config = config

      return modal.show()
    }

    static dispose() {
      _instaces.forEach(modal => {
        delete modal.el._modal
        modal.dispose()
      })
      _instaces.splice(0, _instaces.length)
    }
  }

  // Click handler
  document.addEventListener('click', e => {
    Array.from(e.currentTarget.querySelectorAll('[data-toggle="modal"]')).forEach(el => {
      // The target
      if (e.target == el || el.contains(e.target)) {
        let config = {}
        let selector = el.getAttribute('data-target') && '#' + el.getAttribute('data-target')

        if (el.getAttribute('href')) {
          if (el.getAttribute('href').charAt(0) !== '#')
            config.href = el.getAttribute('href')
          else if (!selector)
            selector = el.getAttribute('href').trim()
        }

        // Kill anchor default behavior
        if (el.tagName === 'A' || el.tagName === 'AREA') {
          e.preventDefault()
        }

        // Create modals
        Array.from(document.querySelectorAll(selector)).forEach(el => Modal.create(el, config))
      }
    })
  })

  return Modal
})()

export default Modal 
