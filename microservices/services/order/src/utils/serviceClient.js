async function request(baseUrl,path,options={}){
  const url=`${baseUrl.replace(/\/$/,'')}${path}`;
  const headers={...(options.headers||{}),'x-internal-service-token':process.env.INTERNAL_SERVICE_TOKEN||''};
  if(options.body && typeof options.body!=='string'){
    headers['content-type']='application/json'; options.body=JSON.stringify(options.body);
  }
  const response=await fetch(url,{...options,headers});
  const text=await response.text();
  let data; try{data=text?JSON.parse(text):null}catch{data={success:false,message:text||'Invalid service response'};}
  return {status:response.status,ok:response.ok,data};
}
async function getJson(baseUrl,path,headers={}){return request(baseUrl,path,{method:'GET',headers});}
async function postJson(baseUrl,path,body,headers={}){return request(baseUrl,path,{method:'POST',body,headers});}
async function patchJson(baseUrl,path,body,headers={}){return request(baseUrl,path,{method:'PATCH',body,headers});}
module.exports={request,getJson,postJson,patchJson};
