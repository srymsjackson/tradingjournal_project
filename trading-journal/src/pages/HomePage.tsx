import BackgroundScene from '../components/BackgroundScene'
import HeroSection from '../components/HeroSection'
import ProductShowcase from '../components/ProductShowcase'
import FreeReveal from '../components/FreeReveal'

function HomePage() {
  return (
    <main className="public-shell landing-page">
      <BackgroundScene />
      <HeroSection />
      <ProductShowcase />
      <FreeReveal />
    </main>
  )
}

export default HomePage
