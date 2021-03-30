<h2>Calculating π using a molecular simulation with Maxwell–Boltzmann distribution</h2>
<h3>Brief description</h3>
<p>
This program calculates π using distribution of velocity of gas molecules (<a target="_blank" href="https://en.wikipedia.org/wiki/Maxwell%E2%80%93Boltzmann_distribution">Maxwell–Boltzmann distribution</a>).<br> 
which has the following characteristics<br>
Mean: μ = 2a√(2/π)<br>
Mode: m = √(2a)<br>
Variance: σ² = a²(3π-8)/π<br>
<br>
Here, we can come up with two ways of deriving pi. One involving mean and mode, and the other involving mean and variance.<br>
Mode way: π = 4*m²/μ²<br>
Variance way: π = 8(σ²+μ²)/(3μ²)<br>
since we have to "pixalate" the result when calculating the mode, the value calculated from mode sometimes jumps between 1-4 (garbage in garbage out)<br>
Variance better converges, but there is a systematic error of unknown origin, and will converge around 3.5.<br>
I may increase the sample size, use a different simulation algorithm, and try again in the future.<br>
<a target="_blank" href="https://codepen.io/MartianLord/full/LYxbZQg">demo</a><br>
<a target="_blank" href="https://github.com/martian17/molecules-pi">Github</a><br>
<a target="_blank" id="github" href="https://github.com/martian17/molecules-pi">Fork me on Github</a><br>
</p>