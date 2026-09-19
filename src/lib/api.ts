import { supabase } from "./supabaseClient";
async function invoke<T=any>(fn:string,body:Record<string,unknown>):Promise<T>{const{data,error}=await supabase.functions.invoke(fn,{body});if(error)throw new Error(error.message??(fn+" failed"));if(data?.error)throw new Error(data.error);return data as T;}
export const api={
checkAverageRate:(categoryId:string)=>invoke("check-average-rate",{categoryId}),
calculateFinalPrice:(jobId:string,offeredPriceCents:number)=>invoke("calculate-final-price",{jobId,offeredPriceCents}),
releaseEscrow:(jobId:string,reason:"client_confirmed"|"auto_release_timer")=>invoke("release-escrow",{jobId,reason}),
applyPenalty:(userId:string,reason:string,jobId?:string)=>invoke("apply-penalty",{userId,reason,jobId}),
verifyDepositProof:(transactionId:string,decision:"approve"|"reject")=>invoke("verify-deposit-proof",{transactionId,decision}),
screenMessage:(jobId:string,content:string)=>invoke("moderate-message",{jobId,content}),
resolveFlaggedMessage:(flaggedMessageId:string,decision:"violation"|"safe")=>invoke("moderate-message",{action:"resolve",flaggedMessageId,decision}),
handleEmergencyReassignment:(jobId:string)=>invoke("handle-emergency-reassignment",{jobId}),
requestDeposit:(amountCents:number,proofUrl:string)=>invoke("wallet-requests",{action:"request-deposit",amountCents,proofUrl}),
requestWithdrawal:(amountCents:number)=>invoke("wallet-requests",{action:"request-withdrawal",amountCents}),
resolveWithdrawal:(transactionId:string,approve:boolean)=>invoke("wallet-requests",{action:"resolve-withdrawal",transactionId,approve}),
acceptOffer:(offerId:string)=>invoke("accept-offer",{offerId}),
jobAction:(jobId:string,action:"pause"|"resume"|"mark-submitted"|"post-update",extra?:Record<string,unknown>)=>invoke("job-actions",{jobId,action,...extra}),
purchaseSubscription:(tier:"basic"|"elite")=>invoke("wallet-requests",{action:"purchase-subscription",tier})
};