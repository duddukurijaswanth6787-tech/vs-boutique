require('dotenv').config({path: './.env'});
const mongoose = require('mongoose');

async function test() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const Boutique = require('./src/models/Boutique');
        const User = require('./src/models/User');
        const Order = require('./src/models/Order');

        console.log('Testing queries...');
        const totalBoutiques = await Boutique.countDocuments({ isDeleted: { $ne: true } });
        console.log('Total Boutiques:', totalBoutiques);
        
        const totalUsers = await User.countDocuments({ isDeleted: { $ne: true } });
        console.log('Total Users:', totalUsers);
        
        const totalOrders = await Order.countDocuments({ isDeleted: { $ne: true } });
        console.log('Total Orders:', totalOrders);
        
        console.log('Success!');
        process.exit(0);
    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
}
test();
