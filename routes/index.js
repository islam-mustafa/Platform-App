
const authRoute = require('./authRoute')
const userRoute = require('./userRoute')
const mountRoutes =(app)=>{
app.use('/api/v1/auth', authRoute);
app.use('/api/v1/users', userRoute);

}

module.exports = mountRoutes