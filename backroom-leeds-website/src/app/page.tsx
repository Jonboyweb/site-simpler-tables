export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Art Deco Sunburst Background */}
      <div className="absolute inset-0 sunburst-bg opacity-10"></div>
      
      {/* Vintage grain overlay */}
      <div className="absolute inset-0 vintage-grain"></div>
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 md:px-24">
        <div className="text-center max-w-4xl">
          {/* Main Title */}
          <h1 className="font-bebas text-6xl md:text-8xl text-speakeasy-gold text-shadow-lg text-shadow-burgundy/50 tracking-wider mb-4">
            THE BACKROOM
          </h1>
          
          {/* Decorative subtitle */}
          <div className="font-great-vibes text-2xl md:text-3xl text-speakeasy-copper mb-6">
            Leeds Premier Speakeasy
          </div>
          
          {/* Description */}
          <p className="font-playfair text-xl md:text-2xl text-speakeasy-champagne mb-8 leading-relaxed max-w-2xl mx-auto">
            Step into prohibition-era elegance beneath the railway bridges. 
            Where jazz flows like whiskey and every night tells a story.
          </p>
          
          {/* Call to action buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button className="art-deco-border bg-gradient-to-r from-speakeasy-burgundy to-speakeasy-burgundy/80 hover:from-speakeasy-burgundy/90 hover:to-speakeasy-burgundy text-speakeasy-champagne px-8 py-4 rounded-sm font-playfair font-medium text-lg vintage-hover transition-all duration-300 min-w-[200px]">
              Reserve Your Table
            </button>
            
            <button className="border-2 border-speakeasy-gold hover:bg-speakeasy-gold hover:text-speakeasy-noir text-speakeasy-gold px-8 py-4 rounded-sm font-playfair font-medium text-lg vintage-hover transition-all duration-300 min-w-[200px]">
              Discover Our Story
            </button>
          </div>
          
          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 border-2 border-speakeasy-gold rounded-full flex justify-center">
              <div className="w-1 h-3 bg-speakeasy-gold rounded-full mt-2 animate-pulse"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Events Preview */}
      <section className="relative py-20 px-6 md:px-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-bebas text-4xl md:text-5xl text-center text-speakeasy-gold mb-16 tracking-wide">
            Tonight's Experience
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Live Jazz Card */}
            <div className="bg-gradient-to-b from-speakeasy-noir to-speakeasy-noir/90 border-2 border-speakeasy-gold/30 shadow-2xl shadow-speakeasy-burgundy/30 p-8 vintage-hover rounded-sm">
              <div className="mb-4">
                <span className="bg-speakeasy-burgundy text-speakeasy-champagne px-3 py-1 text-sm font-playfair tracking-wide">LIVE JAZZ</span>
              </div>
              <h3 className="font-playfair text-2xl text-speakeasy-gold mb-4">Prohibition Night</h3>
              <p className="text-speakeasy-champagne/90 font-playfair leading-relaxed">
                Immerse yourself in the golden age of jazz with live performances that transport you to the roaring twenties.
              </p>
            </div>

            {/* Premium Cocktails Card */}
            <div className="bg-gradient-to-b from-speakeasy-noir to-speakeasy-noir/90 border-2 border-speakeasy-copper/30 shadow-2xl shadow-speakeasy-burgundy/30 p-8 vintage-hover rounded-sm">
              <div className="mb-4">
                <span className="bg-speakeasy-copper text-speakeasy-champagne px-3 py-1 text-sm font-playfair tracking-wide">CRAFT COCKTAILS</span>
              </div>
              <h3 className="font-playfair text-2xl text-speakeasy-gold mb-4">Artisan Libations</h3>
              <p className="text-speakeasy-champagne/90 font-playfair leading-relaxed">
                Handcrafted cocktails using premium spirits and authentic prohibition-era recipes.
              </p>
            </div>

            {/* VIP Experience Card */}
            <div className="bg-gradient-to-b from-speakeasy-noir to-speakeasy-noir/90 border-2 border-speakeasy-burgundy/30 shadow-2xl shadow-speakeasy-burgundy/30 p-8 vintage-hover rounded-sm">
              <div className="mb-4">
                <span className="bg-speakeasy-gold text-speakeasy-noir px-3 py-1 text-sm font-playfair tracking-wide font-medium">VIP ACCESS</span>
              </div>
              <h3 className="font-playfair text-2xl text-speakeasy-gold mb-4">Private Booths</h3>
              <p className="text-speakeasy-champagne/90 font-playfair leading-relaxed">
                Exclusive seating with bottle service in our hidden corners, perfect for intimate gatherings.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}