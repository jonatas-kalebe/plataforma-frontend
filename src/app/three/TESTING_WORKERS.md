# Testing the Particle Physics Web Worker

## Manual Round-Trip Test

This document provides instructions for manually testing the Web Worker message round-trip functionality in the browser console.

## Quick Test in Browser Console

1. **Start the development server:**
   ```bash
   npm start
   ```

2. **Open the application** in your browser (http://localhost:4000)

3. **Open Browser Console** (F12 or Cmd+Option+I)

4. **Paste and run this test code:**

```javascript
// Create worker
const worker = new Worker(
  new URL('./src/app/three/three-particles.worker.ts', import.meta.url),
  { type: 'module' }
);

// Test counter
let testsPassed = 0;
let testsFailed = 0;

// Test 1: INIT message round-trip
console.log('🧪 Test 1: INIT message...');
const particleCount = 10;
const positions = new Float32Array(particleCount * 3);
const velocities = new Float32Array(particleCount * 3);
const originalPositions = new Float32Array(particleCount * 3);

for (let i = 0; i < positions.length; i++) {
  positions[i] = Math.random() * 100;
  originalPositions[i] = positions[i];
  velocities[i] = 0;
}

const config = {
  friction: 0.96,
  returnSpeed: 0.0005,
  maxForce: 0.6,
  maxRadius: 15,
  maxSensibleVelocity: 0.04,
};

worker.onmessage = (event) => {
  const { type, ...data } = event.data;
  
  if (type === 'INIT_COMPLETE') {
    console.log('✅ Test 1 PASSED: INIT_COMPLETE received', data);
    testsPassed++;
    
    // Test 2: STEP message
    console.log('🧪 Test 2: STEP message...');
    const projectionMatrix = new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ]);
    const viewMatrix = new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ]);
    
    worker.postMessage({
      type: 'STEP',
      dt: 0.016,
      timeNow: performance.now(),
      smoothedMouseX: 0,
      smoothedMouseY: 0,
      mouseVelocity: 0,
      shockwaves: [],
      projectionMatrix,
      viewMatrix,
    });
  } else if (type === 'STEP_COMPLETE') {
    console.log('✅ Test 2 PASSED: STEP_COMPLETE received', {
      positionsLength: data.positions.length,
      velocitiesLength: data.velocities.length
    });
    testsPassed++;
    
    // Test 3: UPDATE_CONFIG message
    console.log('🧪 Test 3: UPDATE_CONFIG message...');
    worker.postMessage({
      type: 'UPDATE_CONFIG',
      config: {
        friction: 0.98,
        maxForce: 0.8,
      },
    });
  } else if (type === 'CONFIG_UPDATED') {
    console.log('✅ Test 3 PASSED: CONFIG_UPDATED received', data);
    testsPassed++;
    
    // Summary
    console.log('\n📊 Test Summary:');
    console.log(`✅ Passed: ${testsPassed}`);
    console.log(`❌ Failed: ${testsFailed}`);
    console.log('\n🎉 All tests passed! Worker is functioning correctly.');
    
    worker.terminate();
  }
};

worker.onerror = (error) => {
  console.error('❌ Worker error:', error);
  testsFailed++;
};

// Send INIT message
worker.postMessage({
  type: 'INIT',
  positions,
  velocities,
  originalPositions,
  config,
});

console.log('📤 INIT message sent to worker...');
```

## Expected Output

You should see:

```
🧪 Test 1: INIT message...
📤 INIT message sent to worker...
✅ Test 1 PASSED: INIT_COMPLETE received { particleCount: 10 }
🧪 Test 2: STEP message...
✅ Test 2 PASSED: STEP_COMPLETE received { positionsLength: 30, velocitiesLength: 30 }
🧪 Test 3: UPDATE_CONFIG message...
✅ Test 3 PASSED: CONFIG_UPDATED received { config: {...} }

📊 Test Summary:
✅ Passed: 3
❌ Failed: 0

🎉 All tests passed! Worker is functioning correctly.
```

## Performance Test

To test the worker's performance impact:

```javascript
// Performance test - Compare main thread vs worker
const PARTICLE_COUNT = 1000;
const ITERATIONS = 100;

// Test data
const positions = new Float32Array(PARTICLE_COUNT * 3);
const velocities = new Float32Array(PARTICLE_COUNT * 3);
const originalPositions = new Float32Array(PARTICLE_COUNT * 3);

for (let i = 0; i < positions.length; i++) {
  positions[i] = Math.random() * 100;
  originalPositions[i] = positions[i];
  velocities[i] = 0;
}

// Worker test
const worker = new Worker(
  new URL('./src/app/three/three-particles.worker.ts', import.meta.url),
  { type: 'module' }
);

let workerIterations = 0;
const workerStartTime = performance.now();

worker.onmessage = (event) => {
  if (event.data.type === 'INIT_COMPLETE') {
    console.log('Worker initialized, starting performance test...');
    sendStepMessage();
  } else if (event.data.type === 'STEP_COMPLETE') {
    workerIterations++;
    if (workerIterations < ITERATIONS) {
      sendStepMessage();
    } else {
      const workerTime = performance.now() - workerStartTime;
      console.log(`Worker completed ${ITERATIONS} iterations in ${workerTime.toFixed(2)}ms`);
      console.log(`Average: ${(workerTime / ITERATIONS).toFixed(2)}ms per iteration`);
      worker.terminate();
    }
  }
};

function sendStepMessage() {
  const projectionMatrix = new Float32Array(16);
  const viewMatrix = new Float32Array(16);
  projectionMatrix[0] = projectionMatrix[5] = projectionMatrix[10] = projectionMatrix[15] = 1;
  viewMatrix[0] = viewMatrix[5] = viewMatrix[10] = viewMatrix[15] = 1;
  
  worker.postMessage({
    type: 'STEP',
    dt: 0.016,
    timeNow: performance.now(),
    smoothedMouseX: 0,
    smoothedMouseY: 0,
    mouseVelocity: 0,
    shockwaves: [],
    projectionMatrix,
    viewMatrix,
  });
}

worker.postMessage({
  type: 'INIT',
  positions,
  velocities,
  originalPositions,
  config: {
    friction: 0.96,
    returnSpeed: 0.0005,
    maxForce: 0.6,
    maxRadius: 15,
    maxSensibleVelocity: 0.04,
  },
});
```

## Debugging Tips

### View Worker in DevTools

1. Open Chrome DevTools
2. Go to **Sources** tab
3. Look for **Workers** or **Threads** in the left sidebar
4. Click on the worker to see its code
5. Set breakpoints and debug like normal JavaScript

### Monitor Worker Messages

```javascript
// Log all messages to/from worker
const originalPostMessage = worker.postMessage.bind(worker);
worker.postMessage = function(msg, transfer) {
  console.log('→ Sending to worker:', msg.type, msg);
  return originalPostMessage(msg, transfer);
};

const originalOnMessage = worker.onmessage;
worker.onmessage = function(event) {
  console.log('← Received from worker:', event.data.type, event.data);
  if (originalOnMessage) originalOnMessage(event);
};
```

### Check Memory Transfer

```javascript
// Verify transferable objects are working
worker.postMessage({
  type: 'INIT',
  positions,
  velocities,
  originalPositions,
  config,
}, [positions.buffer, velocities.buffer, originalPositions.buffer]);

// After posting, these should be empty (transferred)
console.log('Positions buffer length after transfer:', positions.buffer.byteLength); // Should be 0
```

## Common Issues

### Worker Not Loading
- **Error:** `SecurityError: Failed to construct 'Worker'`
- **Fix:** Ensure you're running from a web server (http://localhost:4000), not file://

### Messages Not Received
- **Check:** Worker error handler for exceptions
- **Check:** Message type matches exactly (case-sensitive)
- **Check:** All required fields are present in message

### Performance Not Improved
- **Check:** Worker is actually running (DevTools > Sources > Workers)
- **Check:** Using transferable objects (check buffer.byteLength after postMessage)
- **Profile:** Use Chrome DevTools Performance tab to verify physics runs in worker thread

## Next Steps

Once manual testing confirms the worker is functioning:

1. ✅ Integrate worker into ThreeParticleBackgroundComponent
2. ✅ Replace inline physics calculations with worker messages
3. ✅ Add fallback for browsers without worker support
4. ✅ Implement worker pool for multi-core utilization (Wave 3+)
