
// Wrapping function using Promise
const asyncHandler = (requestHandler) =>{
    (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch(next)
    }
}

export { asyncHandler }
// Wrapping function around try-catch block
// const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next)
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message
//         })
//     }
// }