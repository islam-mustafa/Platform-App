
const authRoute = require('./authRoute')
const userRoute = require('./userRoute')
const subjectRoute = require('./subjectRoute')
const sectionRoute = require('./sectionRoute')
const mountRoutes =(app)=>{
app.use('/api/v1/auth', authRoute);
app.use('/api/v1/users', userRoute);
app.use('/api/v1/subjects', subjectRoute);
app.use('/api/v1/sections', sectionRoute);

}

module.exports = mountRoutes