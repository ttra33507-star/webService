import {BakongKHQR, IndividualInfo, khqrData} from 'bakong-khqr';
const merchantName='C4 TECH HUB';
const merchantCity='Phnom Penh';
const planId='local-3m';
const amount=29.99;
const currency='USD';
const phoneNumber='+85569363243';
const fallbackMobile=phoneNumber.replace(/^\+?855/, '0');
const sanitize=(value,max)=>{
  if(value==null) return undefined;
  const str=value.toString().trim();
  if(!str) return undefined;
  if(str.length<=max) return str;
  return str.slice(0,max);
};
const amountString = currency==='KHR' ? Math.round(amount).toString() : amount.toFixed(2);
const optionalFields = {
  amount: amountString,
  currency: khqrData.currency.usd,
  billNumber: sanitize(planId,25),
  merchantCategoryCode: '5999',
  mobileNumber: sanitize(fallbackMobile,25),
  creationTimestamp: Date.now(),
  expirationTimestamp: Date.now() + 15*60*1000,
  terminalLabel: sanitize(merchantName,25),
  storeLabel: sanitize(merchantName,25),
  purposeOfTransaction: sanitize(`Plan ${planId}`,25)
};
const info = new IndividualInfo('seakleng_touch@aclb', merchantName, merchantCity, optionalFields);
const client = new BakongKHQR();
const result = client.generateIndividual(info);
console.log(result);
