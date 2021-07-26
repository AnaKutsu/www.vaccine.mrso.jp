const fs = require('fs').promises;
const { setTimeout } = require('timers/promises');
const { Builder, By, Capabilities, Key, until } = require('selenium-webdriver');
const capabilities = Capabilities.chrome();
const valCityCode = '';
const valTicketNumber = '';
const valBirthYear = '';
const valBirthMonth = '';
const valBirthDay = '';
const cookieName = 'akavpwr_www.vaccine.mrso.jp';
const urlEntrance = 'https://www.vaccine.mrso.jp/sdftokyo/VisitNumbers/visitnoAuth/';
const urlDummy = 'https://www.vaccine.mrso.jp/favicon.ico';
let cookies = [];
let isCookieExists = {};

// Chrome起動時のオプションを指定
capabilities.set('chromeOptions', {
	args: [
		'--disable-gpu',
		'--window-size=1024,1024'
	],
	w3c: false
});

// 予約ページへ入場可能かチェック
const isReservable = async (driver) => {
	await driver.navigate().to(urlEntrance);
	try {
		return await driver.findElement(By.id('VisitnoAuthName'));
	} catch(e) {
		return  false;
	}
	
};

// セッションリストの追加
const addCookie = async (cookie) => {
	isCookieExists[cookie.value] = true;
	console.log('    Got ' + cookie.name + ': ' + cookie.value);
	cookies.push(cookie);
	await fs.writeFile('cookies.json', JSON.stringify(cookies, null, 2));
};

// カレンダーページまで遷移
const navigate = async (driver) => {
	{
		let elmName = await driver.findElement(By.id('VisitnoAuthName'));
		let elmVisitno = await driver.findElement(By.id('VisitnoAuthVisitno'));
		let elmYear = await driver.findElement(By.id('VisitnoAuthYear'));
		let elmMonth = await driver.findElement(By.id('VisitnoAuthMonthMonth'));
		let elmDay = await driver.findElement(By.id('VisitnoAuthDayDay'));
		let elmForm = await driver.findElement(By.id('insuranceFrm'));
		let elmSubmit = await elmForm.findElement(By.xpath("//button[@type='submit']"));
		await elmName.sendKeys(valCityCode);
		await elmVisitno.sendKeys(valTicketNumber);
		await elmYear.findElement(By.xpath("//option[. = '" + valBirthYear + "']")).click();
		await elmMonth.findElement(By.xpath("//option[. = '" + valBirthMonth + "']")).click();
		await elmDay.findElement(By.xpath("//option[. = '" + valBirthDay +"']")).click();
		await elmSubmit.click();
	}
	await driver.wait(until.titleContains('接種者情報確認'));
	{
		let elmForm = await driver.findElement(By.id('firstConfirmForm'));
		let elmSubmit = await elmForm.findElement(By.xpath("//button[@type='submit']"));
		await elmSubmit.click();
	}
	await driver.wait(until.titleContains('接種会場一覧'));
	{
		let elmButton = await driver.findElement(By.css('.covid19_move_plan_detail'));
		await elmButton.click();
	}
	await driver.wait(until.titleContains('会場詳細'));
	{
		let elmButton = await driver.findElement(By.id('calendar_link'));
		await elmButton.click();
	}
};

(async () => {
	const driver = await new Builder()
		.withCapabilities(capabilities)
		.build();
	try {
		await fs.readFile('cookies.json', 'utf8')
			.then((content) => {
				cookies = JSON.parse(content);
				for (cookie of cookies) {
					isCookieExists[cookie.value] = true;
				}
			})
			.catch((err) => {
			});
		;
		await driver.get(urlDummy);
		while (true) {
			let reservable = false;
			// 現在までのセッションで入場できるものがないかチェック
			console.log('-----');
			console.log(Date());
			console.log('Checking old session');
			for (cookie of cookies) {
				console.log('    Reset ' + cookieName + ': ' + cookie.value);
				await driver.navigate().to(urlDummy);
				await driver.manage().deleteCookie(cookieName);
				await driver.manage().addCookie(cookie);
				reservable = await isReservable(driver);
				// 新しいセッションが発行されたらリストに追加
				let c = await driver.manage().getCookie(cookieName);
				if (c && !isCookieExists[c.value]) {
					await addCookie(c);
				}
				// 予約可能ならループ終了
				if (reservable) {
					break;
				}
			}
			// 予約ができない状態なら新しいセッションを取得
			if (!reservable) {
				console.log('Checking new session');
				while (true) {
					await setTimeout(1000);
					await driver.navigate().to(urlDummy);
					await driver.manage().deleteCookie(cookieName);
					reservable = await isReservable(driver);
					if (reservable) {
						break;
					} else {
						let cookie = await driver.manage().getCookie(cookieName);
						if (cookie && !isCookieExists[cookie.value]) {
							await addCookie(cookie);
							break;
						}
					}
				}
			}
			// 予約可能ならカレンダーページまで遷移してブラウザ開いたまま終了
			if (reservable) {
				console.log('Navigate to reservation page');
				await navigate(driver);
				process.exit(0);
			}
			await setTimeout(1000);
		}
	} catch(e) {
		console.log(e);
	} finally {
//		driver && await driver.quit()
	}
})();
