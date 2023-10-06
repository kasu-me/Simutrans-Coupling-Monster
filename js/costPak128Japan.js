//導入年から係数の計算
function calcKeisu(introYear) {
	return 115 - 5 * ((Math.floor(introYear / 10) * 10 - 1900) / 10);
}

//calcGear(最高速度,起動加速度,編成重量,編成定員,編成出力) 編成全体のギア計算
function calcGear(speed, startingAcceleration, formationWeight, formationPayload, formationPower, isBoostMode) {
	var gear = Math.floor((formationWeight + 0.06 * formationPayload) * (startingAcceleration * 4.335030006) / formationPower * 100);
	if (Boolean(isBoostMode)) { gear = Math.floor(gear * 1.2); }
	return gear
}
//calcCost(ギア比,最高速度,起動加速度,車両定員,車両出力) 車両ごとのコスト計算
function calcCost(gear, speed, payload, power, keisuu) {
	let cost = (800 * payload * Math.pow(speed, 0.5)) / 10 + (power * gear * Math.pow(speed, 0.7)) / 20;
	let runningCost = 0.004 * (payload * Math.pow(speed, 0.5) / 10 + ((power * gear) * Math.pow(speed, 0.4) / 1000)) * keisuu / 100 * 100;

	cost = Math.round(cost / 1000) * 100000;
	runningCost = Math.round(runningCost);
	return { runningcost: runningCost, cost: cost };
}