export default function FloatingCardBackground() {
	return (
	    <div className="pointer-events-none absolute inset-0 overflow-hidden">
	      {/* Card 1 */}
	      <div className="animate__animated animate__slideInLeft left-[5%] mt-25">
		      <div
			className="
			  absolute 
			  left-[5%] top-[18%]
			  h-48 w-80
			  rounded-3xl
			  bg-gradient-to-br from-[#1A103D] via-[#0A0F1F] to-[#FF2E9A33]
			  border border-white/10
			  shadow-[0_20px_60px_rgba(0,0,0,0.6)]
			  backdrop-blur
			  [transform:rotateX(18deg)_rotateY(-18deg)_rotateZ(-6deg)]
			  animate-card-float-slow 
			"
		      >
			<div className="flex h-full flex-col justify-between p-5 text-sm text-white/90">
			  <div className="flex items-center justify-between">
			    <span className="text-xs uppercase tracking-[0.2em] text-white/60">
			      Credit Card
			    </span>
			    <span className="rounded-full bg-white/10 px-3 py-1 text-[10px]">
			      Aggregated
			    </span>
			  </div>

			  <div>
			    <div className="mb-2 text-xs text-white/60">Balance</div>
			    <div className="text-2xl font-semibold">$3,482.19</div>
			  </div>

			  <div className="flex items-center justify-between text-[11px] text-white/70">
			    <span>**** 3948</span>
			    <span>12/27</span>
			  </div>
			</div>
		      </div>
	      </div>

	      {/* Card 2 */}
	      <div className="right-[5%] mt-55 animate__animated animate__slideInRight">
		      <div
			className="
			  absolute 
			  right-[5%] top-[35%]
			  h-40 w-72
			  rounded-3xl
			  bg-gradient-to-br from-[#A259FF] via-[#3A86FF] to-[#FF2E9A]
			  border border-white/20
			  shadow-[0_24px_70px_rgba(0,0,0,0.7)]
			  [transform:rotateX(22deg)_rotateY(14deg)_rotateZ(8deg)]
			  animate-card-float-medium
			  opacity-90
			"
		      >
			<div className="flex h-full flex-col justify-between p-4 text-xs text-white">
			  <div className="flex items-center justify-between">
			    <span className="uppercase tracking-[0.18em] text-white/70">
			      Utilization
			    </span>
			    <span className="text-sm font-semibold">23%</span>
			  </div>

			  <div className="mt-2">
			    <div className="mb-1 flex justify-between text-[11px] text-white/70">
			      <span>Used</span>
			      <span>$4,600 / $20,000</span>
			    </div>
			    <div className="h-1.5 w-full rounded-full bg-white/15">
			      <div className="h-full w-[23%] rounded-full bg-white/90" />
			    </div>
			  </div>

			  <div className="flex items-center justify-between text-[11px] text-white/75">
			    <span>Chase Sapphire</span>
			    <span>**** 1029</span>
			  </div>
			</div>
		      </div>
	      </div>

	      {/* Soft glow behind everything */}
	      <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,#A259FF33,#0A0F1F_60%)] blur-3xl" />
	    </div>
	)
}
