const axios = require('axios');

// ⬇️ PASTE YOUR API KEY HERE
const API_KEY = 'ffc4103095a7430c6012640b6b58694d';

const BASE = 'http://api.agromonitoring.com/agro/1.0';

async function runTest() {
  console.log('🚀 Starting AgroMonitoring API Test...\n');

  // ── TEST 1: List all your polygons ──
  try {
    console.log('📍 TEST 1: Fetching your polygons...');
    const polygons = await axios.get(`${BASE}/polygons?appid=${API_KEY}`);
    
    if (polygons.data.length === 0) {
      console.log('❌ No polygons found. Create one on the dashboard first!\n');
      return;
    }
    
    console.log(`✅ Found ${polygons.data.length} polygon(s):`);
    polygons.data.forEach((p, i) => {
      console.log(`   ${i + 1}. Name: ${p.name} | ID: ${p.id} | Area: ${p.area} ha`);
    });
    
    const polyId = polygons.data[0].id;
    console.log(`\n🎯 Using polygon: ${polygons.data[0].name} (${polyId})\n`);

    // ── TEST 2: Get NDVI history ──
    console.log('🌱 TEST 2: Fetching NDVI (crop health) data...');
    
    // Last 90 days
    const end = Math.floor(Date.now() / 1000);
    const start = end - (90 * 24 * 60 * 60);
    
    const ndvi = await axios.get(
      `${BASE}/ndvi/history?polyid=${polyId}&start=${start}&end=${end}&appid=${API_KEY}`
    );
    
    if (ndvi.data.length === 0) {
      console.log('⚠️ No NDVI data yet (satellite may not have passed, or polygon too new).');
      console.log('   This is OK — we can use historical/demo data as fallback.\n');
    } else {
      console.log(`✅ Got ${ndvi.data.length} NDVI readings:`);
      
      // Show last 5 readings
      const recent = ndvi.data.slice(-5);
      recent.forEach(reading => {
        const date = new Date(reading.dt * 1000).toLocaleDateString('en-IN');
        const mean = reading.data?.mean?.toFixed(3) || 'N/A';
        console.log(`   📅 ${date} → NDVI: ${mean}`);
      });
      
      // Latest NDVI
      const latest = ndvi.data[ndvi.data.length - 1];
      const latestNDVI = latest.data?.mean || 0;
      console.log(`\n🏆 Latest NDVI: ${latestNDVI.toFixed(3)}`);
      
      // Yield estimation demo
      const areaHa = polygons.data[0].area || 10;
      const estimatedYield = (4.5 * latestNDVI * areaHa).toFixed(1);
      console.log(`🌾 Estimated Paddy Yield: ~${estimatedYield} tonnes (for ${areaHa} ha)`);
    }

    // ── TEST 3: Get current weather for the polygon ──
    console.log('\n☁️ TEST 3: Fetching weather data...');
    try {
      const weather = await axios.get(
        `${BASE}/weather?polyid=${polyId}&appid=${API_KEY}`
      );
      console.log(`✅ Weather: ${weather.data.weather?.[0]?.description || 'N/A'}`);
      console.log(`   Temp: ${weather.data.main?.temp}°C | Humidity: ${weather.data.main?.humidity}%`);
    } catch (wErr) {
      console.log('⚠️ Weather endpoint not available on free tier (OK, not critical)');
    }

    console.log('\n🎉 API TEST COMPLETE — You are ready to build GramSetu!');
    
  } catch (err) {
    console.log('\n❌ ERROR:');
    if (err.response) {
      console.log(`   Status: ${err.response.status}`);
      console.log(`   Message:`, err.response.data);
      
      if (err.response.status === 401) {
        console.log('\n💡 Fix: Your API key is wrong. Copy it again from dashboard → API KEYS');
      }
      if (err.response.status === 404) {
        console.log('\n💡 Fix: Polygon not found. Create one on the dashboard first.');
      }
    } else {
      console.log('   ', err.message);
    }
  }
}

runTest();