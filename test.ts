const {handler} = require("./index");
// handler({queryStringParameters: {target: "TSSK2,CAMK2A"}}).then((res: any) => {
handler({queryStringParameters: {disease: "D001249"}}).then((res: any) => {
    // console.log(res);
    const resobj = JSON.parse(res.body);
    resobj.forEach((resp: any) => {
        console.log(resp);
    })
});
// console.log(handler({queryStringParameters: {ligand: "sunitinib"}}));
// console.log(handler({queryStringParameters: {disease: "D008175"}}));
// console.log(handler({queryStringParameters: {disease: "D009379,D019042"}}));
// console.log(handler({queryStringParameters: {allDiseases: 1}}));