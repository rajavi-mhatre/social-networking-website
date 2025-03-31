//import statement
import puppeteer from "puppeteer";
const url="https://phys.org/space-news/";

//launching the browser
const browser = await puppeteer.launch({
    headless:false,
    ignoreHTTPSErrors:true,
});

let page = await browser.newPage();


//navigates to the URL.
await page.goto(url,{
    waitUntil: 'domcontentloaded',
});
console.log('Hi 1');

// await page.waitForSelector(`#onetrust-accept-btn-handler`, {timeout:10_000}); //Commented out because it showed an error.
console.log('Hi 2');
// await page.click('#onetrust-accept-btn-handler'); //Commented out because it showed error.


//logs the page content
console.log(await page.content());


//iterates through the headers
let h2Headers=await page.$$('h2');

for (const h2Header of h2Headers){
    const h2Text = await h2Header.evaluate(node => node.innerText);
    console.log(`H2 Heading:  ${h2Text}`);

    let pageTextArray=await page.$$('.text p');

    for (const text of pageTextArray){
        const  textContent=await text.evaluate(node=>node.innerText);
        console.log(`Page text: ${textContent}`);
    }
}

//closes the page and the browser.
await page.close();
await browser.close();