module.exports = {
    multipleMongooseToObj: function(mongoose) {
        return mongoose.map(mongoose => mongoose.toObject());
    },
    mongooseToObj: function(mongoose) {
        return mongoose.toObject;
    }
}