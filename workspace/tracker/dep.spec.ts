import { suite, test, slow, timeout } from "mocha-typescript";
import { assert, expect } from "chai";
import Dep from "./dep"

@suite class Test {
    @test test1() {
			let counter = 0
			let a = Dep.val(1)
			let b = Dep.val(1)

			let c = Dep.signal(() => { 
				let sum = a.value + b.value
				counter++
				console.log(sum)
				return sum
			})

			expect((a as any).depending).to.deep.eq([c])
			expect((b as any).depending).to.deep.eq([c])

			a.value = 2

			expect(counter).to.eq(2)
			expect((c as any).current).to.eq(3)
		}

    @test chain() {
			let counter = 0
			let a = Dep.val(1)
			let deps = [a]

			let chain = a
			for (let i = 0; i < 99; i++) {
				chain = (function (c) {
					let dep = Dep.signal(() => c.value + 1)
					deps.push(dep)
					return dep
				})(chain)
			}

			Dep.signal(() => {
				console.log(chain.value)
			})

			deps.forEach(d => expect((d as any).depending).to.have.lengthOf(1))

			expect((chain as any).current).to.eq(100)
			a.value = 2
			expect((chain as any).current).to.eq(101)
			a.value = 3
			expect((chain as any).current).to.eq(102)
		}
}