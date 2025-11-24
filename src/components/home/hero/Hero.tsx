import FloatingCardBackground from "./FloatingCardBackground"

export default function Hero() {
	return (
	    <section className="flex relative min-h-[75vh] overflow-hidden bg-[#0A0F1F] text-center">
	      <FloatingCardBackground />

	      <div className="relative mx-auto flex max-w-5xl flex-col gap-6 px-6 py-20 lg:flex-row lg:items-center">
		<div className="max-w-xl">
		  <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
		    All your{" "}
		    <span className="bg-gradient-to-r from-[#A259FF] via-[#3A86FF] to-[#FF2E9A] bg-clip-text text-transparent">
		      credit cards
		    </span>{" "}
		    in one clean view.
		  </h1>
		  <p className="mt-4 text-sm text-white/60 sm:text-base">
		    Track balances, utilization, and due dates across Amex, Chase,
		    Apple, and more—without opening five different banking apps.
		  </p>

		  <div className="mt-6 flex gap-3 justify-center font-bold">
		    <button className="rounded-full bg-[#FF2E9A] px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-[#FF2E9A55]">
		      Get started
		    </button>
		    <button className="rounded-full border border-white/20 px-5 py-2.5 text-sm text-white/80">
		      View demo
		    </button>
		  </div>
		</div>
	      </div>
	    </section>
	)
}
