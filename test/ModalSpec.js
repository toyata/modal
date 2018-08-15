describe('Modal', function() {
  // Events
  let _click = document.createEvent('Event')
  _click.initEvent('click', true, true)

  const events = {
    click: _click
  }

  let triggers = document.querySelectorAll('[data-toggle="modal"]')
  let modals = document.querySelectorAll('.modal')

  describe('Func', function() {
    afterEach(function() {
      Modal.dispose()
    })

    it('Clear', function(done) {
      modals[0].addEventListener('shown', ()=> {
        let modal = Modal.instance(modals[0]).clear()

        expect(modals[0].classList.contains('show')).toBeFalsy()
        expect(document.querySelectorAll('modal-backdrop').length).toBe(0)

        done()
      }, {once: true})

      triggers[2].dispatchEvent(events.click)
    })

    it('On', function(done) {
      Modal.create(modals[0]).then(() => {
        let modal = Modal.instance(modals[0])
        let test = {
          test: function() {},
          test2: function() {},
        }

        spyOn(test, 'test')
        spyOn(test, 'test2')

        modal._on('click', modal.el, test.test)
        modal._on('click', modal.el, test.test2)

        modal.el.dispatchEvent(events.click)

        expect(test.test.calls.count()).toBe(1)
        expect(test.test2.calls.count()).toBe(1)

        modal._off('click', modal.el)

        modal.el.dispatchEvent(events.click)

        expect(modal.el._e['click']).not.toBeDefined()
        expect(test.test.calls.count()).toBe(1)
        expect(test.test2.calls.count()).toBe(1)

        done()
      })
    })
  })

  describe('Config', function() {
    let modal = new Modal

    it('No href', function() {
      let config = modal._getConfig()

      expect(config.href).not.toBeDefined()
    })

    it('No selector', function() {
      let config = modal._getConfig({
        href: 'http://test.com/bbb/'
      })

      expect(config.href).toBe('http://test.com/bbb/')
    })

    it('With selector', function() {
      let config = modal._getConfig({
        href: 'http://test.com/bbb/?d=e&f=g#abc'
      })

      expect(config.href).toBe('http://test.com/bbb/?d=e&f=g')
      expect(config.selector).toBe('#abc')
    })
  })

  describe('Initialize', function() {
    afterEach(function() {
      Modal.dispose()
    })

    it('No target', function() {
      triggers[0].dispatchEvent(events.click)
      triggers[1].dispatchEvent(events.click)

      expect(Modal.instances.length).toBe(0)
    })

    it('A target', function(done) {
      triggers[2].dispatchEvent(events.click)

      expect(Modal.instances.length).toBe(1)
      expect(Modal.instance(modals[0]) instanceof Modal).toBeTruthy()
      expect(document.body.classList.contains('modal-open')).toBeTruthy()

      modals[0].addEventListener('show', ()=> {
        expect(Modal.instances.length).toBe(1)
        done()
      }, {once: true})

      // Second time
      triggers[2].dispatchEvent(events.click)
    })

    it('Target by href attributes', function() {
      triggers[4].dispatchEvent(events.click)

      expect(Modal.instances.length).toBe(1)
      expect(Modal.instances[0].el.id).toBe('modal-test')
    })
  })

  describe('Show', function() {
    afterEach(function() {
      Modal.dispose()
    })

    it('Backdrop', function(done) {
      modals[0].addEventListener('shown', ()=> {
        expect(document.querySelectorAll('.modal-backdrop').length).toBe(1)
        expect(document.querySelector('.modal-backdrop').classList.contains('show')).toBeTruthy()

        done()
      }, {once: true})

      triggers[2].dispatchEvent(events.click)
    })

    it('Element', function(done) {
      modals[0].addEventListener('shown', ()=> {
        expect(modals[0].classList.contains('show')).toBeTruthy()
        expect(window.getComputedStyle(modals[0]).display).toBe('block')

        done()
      }, {once: true})

      triggers[2].dispatchEvent(events.click)
    })
  })

  describe('Hide', function() {
    afterEach(function() {
      Modal.dispose()
    })

    it('Element', function(done) {
      Modal.create(modals[0])
        .then(() => {
          let modal = Modal.instance(modals[0])
          let test = {
            test: function() {}
          }

          spyOn(test, 'test');

          let backdrop = modal._backdrop

          modal.el.addEventListener('hidden', () => {
            expect(backdrop.classList.contains('show')).toBeFalsy()
            expect(modal.el.classList.contains('show')).toBeFalsy()
            expect(document.body.classList.contains('modal-open')).toBeFalsy()
            expect(window.getComputedStyle(modals[0]).display).toBe('none')
            expect(window.location.hash).toBe('')

            test.test()
          })

          setTimeout(() => {
            expect(test.test.calls.count()).toBe(1)
            done()
          }, 100)

          modal.el.querySelector('[data-dismiss="modal"]').dispatchEvent(events.click)
        })
    })
  })

  describe('Async', function() {
    afterEach(function() {
      Modal.dispose()
    })

    it('Show', function(done) {
      let el = modals[1]

      el.addEventListener('shown', ()=> {
        let modal = Modal.instance(el)

        expect(modal._backdrop.classList.contains('show')).toBeTruthy()
        expect(modal._backdrop.classList.contains('fade')).toBeTruthy()

        expect(window.getComputedStyle(modal.el).opacity).toBe('1')

        expect(el.classList.contains('show')).toBeTruthy()
        expect(window.getComputedStyle(el).display).toBe('block')

        done()
      }, {once: true})


      triggers[3].dispatchEvent(events.click)

      expect(window.getComputedStyle(Modal.instance(el)._backdrop).opacity).toBe('0')
      expect(window.getComputedStyle(el).opacity).toBe('0')

      setTimeout(() => {
        expect(window.getComputedStyle(Modal.instance(el)._backdrop).opacity).not.toBe('0')
        expect(window.getComputedStyle(el).opacity).not.toBe('0')
      }, 30)
    })

    it('Hide', function(done) {
      let el = modals[1]

      el.addEventListener('hidden', ()=> {
        let modal = Modal.instance(el)

        expect(modal._backdrop).toBeNull()
        expect(window.getComputedStyle(modal.el).display).toBe('none')

        done()
      }, {once: true})

      Modal.create(el).then(() => {
        let modal = Modal.instance(el)

        expect(window.getComputedStyle(modal._backdrop).opacity).toBeGreaterThan(.94)
        expect(window.getComputedStyle(el).opacity).toBe('1')

        Modal.instance(el).hide()

        setTimeout(() => {
          expect(window.getComputedStyle(modal._backdrop).opacity).not.toBe('0')
          expect(window.getComputedStyle(el).opacity).not.toBe('0')
        }, 30)
      })
    })
  })

  describe('External', function() {
    afterEach(function() {
      Modal.dispose()
    })

    it('Has modal-content block', function(done) {
      triggers[5].dispatchEvent(events.click)

      modal = Modal.instances[0]

      modal.el.addEventListener('shown', () => {
        expect(modal.el.querySelector('.modal-content').childNodes.length).not.toBe(0)
        done()
      }, {once: true})

      expect(modal._config.href).toBe('external.html')
      expect(modal._config.selector).toBe('#modal-content')
      expect(modal._content.classList.contains('modal-content')).toBe(true)
    })
    
    // No modal content
  })
})

