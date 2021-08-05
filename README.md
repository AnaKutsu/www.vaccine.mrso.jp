# 自衛隊東京大規模接種センター （東京センター） 予約確率向上プログラム

コードからお察しください。モラルを持った使い方を。

ワクチンの供給見通しが良くなればこんなことはしなくて済むようになると思うので、待てる方は落ち着いて時を待たれよ。

## How to

* cd /path/to/your/working/dir/
* git clone https://github.com/AnaKutsu/www.vaccine.mrso.jp.git
* npm install
* Chrome webdriver を https://chromedriver.chromium.org/downloads から取得して展開
* index.js の valCityCode, valTicketNumber, valBirthYear, valBirthMonth, valBirthDay 定数値を記入
* node index.js