import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const execAsync = promisify(exec)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const BUNDLE_SIZE_LIMITS = {
  'index.js': 200 * 1024, // 200KB
  'vendor.js': 500 * 1024, // 500KB
  'index.css': 50 * 1024, // 50KB
  total: 800 * 1024, // 800KB total
}

async function analyzeBundleSize() {
  console.log('🔍 Analyzing bundle size...\n')

  try {
    // Build the project
    console.log('📦 Building project...')
    await execAsync('npm run build', { cwd: path.join(__dirname, '..') })

    // Get build directory
    const distPath = path.join(__dirname, '..', 'dist')
    const assetsPath = path.join(distPath, 'assets')

    // Read all files in assets directory
    const files = await fs.readdir(assetsPath)
    
    const bundleInfo = []
    let totalSize = 0

    for (const file of files) {
      const filePath = path.join(assetsPath, file)
      const stats = await fs.stat(filePath)
      const sizeInKB = stats.size / 1024

      bundleInfo.push({
        name: file,
        size: stats.size,
        sizeKB: sizeInKB.toFixed(2),
        gzip: await getGzipSize(filePath),
      })

      totalSize += stats.size
    }

    // Sort by size
    bundleInfo.sort((a, b) => b.size - a.size)

    // Print results
    console.log('\n📊 Bundle Analysis Results:\n')
    console.log('File                                    Size      Gzip')
    console.log('─'.repeat(60))

    bundleInfo.forEach(({ name, sizeKB, gzip }) => {
      const nameStr = name.padEnd(36)
      const sizeStr = `${sizeKB} KB`.padEnd(10)
      const gzipStr = `${(gzip / 1024).toFixed(2)} KB`
      
      console.log(`${nameStr} ${sizeStr} ${gzipStr}`)
    })

    console.log('─'.repeat(60))
    console.log(`Total:`.padEnd(36), `${(totalSize / 1024).toFixed(2)} KB`)

    // Check against limits
    console.log('\n🎯 Size Limit Checks:\n')
    
    let hasViolations = false
    
    if (totalSize > BUNDLE_SIZE_LIMITS.total) {
      console.log(`❌ Total bundle size (${(totalSize / 1024).toFixed(2)} KB) exceeds limit (${(BUNDLE_SIZE_LIMITS.total / 1024).toFixed(2)} KB)`)
      hasViolations = true
    } else {
      console.log(`✅ Total bundle size is within limits`)
    }

    // Analyze chunk composition
    await analyzeChunkComposition(bundleInfo)

    // Suggest optimizations
    if (hasViolations) {
      console.log('\n💡 Optimization Suggestions:\n')
      console.log('1. Enable code splitting for routes')
      console.log('2. Lazy load heavy components')
      console.log('3. Use dynamic imports for optional features')
      console.log('4. Review and tree-shake unused dependencies')
      console.log('5. Optimize images and assets')
    }

    return { bundleInfo, totalSize, hasViolations }
  } catch (error) {
    console.error('❌ Error analyzing bundle:', error)
    process.exit(1)
  }
}

async function getGzipSize(filePath) {
  try {
    const { stdout } = await execAsync(`gzip -c ${filePath} | wc -c`)
    return parseInt(stdout.trim())
  } catch {
    return 0
  }
}

async function analyzeChunkComposition(bundleInfo) {
  console.log('\n📈 Chunk Composition:\n')

  const jsFiles = bundleInfo.filter(f => f.name.endsWith('.js'))
  const cssFiles = bundleInfo.filter(f => f.name.endsWith('.css'))
  const otherFiles = bundleInfo.filter(f => !f.name.endsWith('.js') && !f.name.endsWith('.css'))

  const jsTotal = jsFiles.reduce((sum, f) => sum + f.size, 0)
  const cssTotal = cssFiles.reduce((sum, f) => sum + f.size, 0)
  const otherTotal = otherFiles.reduce((sum, f) => sum + f.size, 0)

  console.log(`JavaScript: ${(jsTotal / 1024).toFixed(2)} KB (${jsFiles.length} files)`)
  console.log(`CSS:        ${(cssTotal / 1024).toFixed(2)} KB (${cssFiles.length} files)`)
  console.log(`Other:      ${(otherTotal / 1024).toFixed(2)} KB (${otherFiles.length} files)`)

  // Find largest dependencies
  if (jsFiles.length > 0) {
    console.log('\n🏗️ Largest JavaScript Chunks:')
    jsFiles.slice(0, 5).forEach(({ name, sizeKB }) => {
      console.log(`  - ${name}: ${sizeKB} KB`)
    })
  }
}

// Run the analysis
analyzeBundleSize().then(({ hasViolations }) => {
  process.exit(hasViolations ? 1 : 0)
})