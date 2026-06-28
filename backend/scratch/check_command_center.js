const baseUrl = 'http://localhost:3000';

async function run() {
    console.log('Logging in as superadmin...');
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'superadmin', password: 'admin@123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('Login successful. Token acquired.');

    console.log('Fetching /admin/command-center stats...');
    const startTime = Date.now();
    const statsRes = await fetch(`${baseUrl}/admin/command-center`, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });
    const statsData = await statsRes.json();
    const duration = Date.now() - startTime;

    console.log(`API responded in ${duration}ms (target: < 500ms).`);
    console.log('Response status:', statsRes.status);
    console.log('Response body keys:', Object.keys(statsData));
    console.log('KPI Metrics:', {
        revenueToday: statsData.revenueToday,
        revenueTodayGrowth: statsData.revenueTodayGrowth,
        revenueMonth: statsData.revenueMonth,
        revenueMonthGrowth: statsData.revenueMonthGrowth,
        ordersToday: statsData.ordersToday,
        completedOrdersToday: statsData.completedOrdersToday,
        pendingOrdersToday: statsData.pendingOrdersToday,
        bookingsToday: statsData.bookingsToday,
        acceptedBookings: statsData.acceptedBookings,
        pendingBookings: statsData.pendingBookings,
        completedBookings: statsData.completedBookings,
        activeCustomers: statsData.activeCustomers,
        newCustomers: statsData.newCustomers,
        activeBoutiques: statsData.activeBoutiques,
        totalBoutiques: statsData.totalBoutiques,
        pendingTickets: statsData.pendingTickets,
        highPriorityTickets: statsData.highPriorityTickets,
        slaBreached: statsData.slaBreached,
        pendingReviews: statsData.pendingReviews,
        flaggedReviews: statsData.flaggedReviews,
        pendingPayoutAmount: statsData.pendingPayoutAmount,
        pendingPayoutCount: statsData.pendingPayoutCount
    });
    console.log('System Health Monitor:', statsData.health);
    console.log('Live Alert Panel Size:', statsData.alerts.length);
    console.log('First 2 Alerts:', statsData.alerts.slice(0, 2));
    console.log('Trends sample (Revenue length):', statsData.trends.revenue.length);
    console.log('Trends sample (Orders length):', statsData.trends.orders.length);
    process.exit(0);
}

run().catch(console.error);
