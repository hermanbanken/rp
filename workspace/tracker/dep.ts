export default class Dep<T> {
  static active?: Dep<any>
  static val<T>(t: T) { return new Dep(t) }
  static signal<T>(c: () => T) { return new Dep(undefined, c) }

  private dirty = false
  private depending: Dep<any>[] = []

  constructor(private current?: T, private compute?: () => T) {
    if(typeof compute === "function") {
      this.dirty = true
      let initial = this.value
    }
  }

  get value() {
    if(Dep.active && this.depending.indexOf(Dep.active) < 0) {
      this.depending.push(Dep.active)
    }
    if(typeof this.compute === "function" && !this.dirty) {
      return this.current
    }
    let value
    if (typeof this.compute === "function") {
      let previous = Dep.active
      Dep.active = this
      value = this.current = this.compute()
      Dep.active = previous
      this.dirty = false
    } else {
      value = this.current
    }
    return value
  }

  set value(value: T) {
    if(typeof this.compute === "function") {
      throw new Error("Cannot set value of computed property")
    }
    if(value !== this.current) {
      this.current = value
      this.depending.forEach(d => d.trigger())
    }
  }

  trigger() {
    this.dirty = true
    if(this.current !== this.value) {
      this.depending.forEach(d => d.trigger())
    }
  }
}