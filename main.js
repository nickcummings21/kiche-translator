
// let fire = new Firebase('https://kiche-translator.firebaseio.com/');
// console.log(fire);

let translateEls = {};
let addEls = {};
let themeEls = {};

let langs = {to: 'kiche', from: 'english'};
let translateDirection = "English to K'iche'";
let translationPairs = [];
let translationPairsById = {};

function loadContent() {
    translateEls = {
        tab: document.querySelector('#translate-tab'),
        section: document.querySelector('.translate')
    }
    
    addEls = {
        tab: document.querySelector('#add-tab'),
        section: document.querySelector('.add-content')
    }
    
    themeEls = {
        tab: document.querySelector('#theme-tab'),
        section: ''
    }
    getTranslations();
}

function setActiveTab(tab) {
    switch(tab) {
        case 'translate':
            translateEls.tab.classList.add('active');
            translateEls.section.classList.add('active');
            addEls.tab.classList.remove('active');
            addEls.section.classList.remove('active');
            themeEls.tab.classList.remove('active');
            break;
        case 'add':
            translateEls.tab.classList.remove('active');
            translateEls.section.classList.remove('active');
            addEls.tab.classList.add('active');
            addEls.section.classList.add('active');
            themeEls.tab.classList.remove('active');
            break;
        case 'theme':
            translateEls.tab.classList.remove('active');
            translateEls.section.classList.remove('active');
            addEls.tab.classList.remove('active');
            addEls.section.classList.remove('active');
            themeEls.tab.classList.add('active');
            break;
        default:
    }
}

function addTranslation() {
    let engTextInput = document.querySelector('#new-eng-text');
    let kchTextInput = document.querySelector('#new-kch-text');
    let engText = engTextInput.value;
    let kchText = kchTextInput.value;
    engTextInput.value = '';
    kchTextInput.value = '';
    
    if (engText === '' || kchText === '') return;

    let engExampleInput = document.querySelector('#new-eng-example');
    let kchExampleInput = document.querySelector('#new-kch-example');
    let engExample = engExampleInput.value;
    let kchExample = kchExampleInput.value;
    engExampleInput.value = '';
    kchExampleInput.value = '';
    
    let translation = {
        kiche: kchText,
        english: engText,
        examples: [
            {
                kiche: kchExample,
                english: engExample
            }
        ]
    };
    doPost(JSON.stringify(translation));
    sleep(500).then(() => getTranslations());
}

function doPost(data) {
    let url = 'https://kiche-translator.firebaseio.com/kiche.json';
    let req = new XMLHttpRequest();
    req.open("POST", url, true);
    req.setRequestHeader("Content-Type", "application/json");
    req.onreadystatechange = function () {
        if (req.readyState === 4 && req.status === 200) {
            let json = JSON.parse(req.responseText);
            console.log(json);
        }
    };
    req.send(data);
}

function getTranslations() {
    translationPairs = [];

    let req = new XMLHttpRequest();
    let url = 'https://kiche-translator.firebaseio.com/kiche.json';
    req.open("GET", url);
    req.send();
    req.onreadystatechange = (e) => {
        if (req.readyState != 4) return;
        let resp = JSON.parse(req.response);
        console.log(resp);

        translationPairsById = resp;
        for (let translationId in resp) {
            resp[translationId].id = translationId;
            if (resp[translationId].examples == undefined) {
                resp[translationId].examples = [];
            }
            translationPairs.push(resp[translationId]);
        }
        console.log(translationPairs);
    }
}

function updateTranslationPair(translationPair) {
    console.log('Updating', translationPair);
    let id = translationPair.id;
    delete translationPair.id;

    let url = 'https://kiche-translator.firebaseio.com/kiche/';
    fetch(url + id + '.json', {
      method: 'PUT',
      body: JSON.stringify(translationPair)  
    })
    .then(response => console.log(response, getTranslations()));
}

function removeTranslationPair(event, id) {
    console.log('Deleting', event.path[2]);
    let toRemove = event.path[2];

    if (!toRemove.classList.contains('translation')) {
        alert('ERROR');
        return;
    } 
    toRemove.parentNode.removeChild(toRemove);

    if (event.shiftKey) {
        doDelete(id);
    }
}

function doDelete(id) {
    let url = 'https://kiche-translator.firebaseio.com/kiche/';
    fetch(url + id + '.json', {
        method: 'DELETE'
    })
    .then(response => console.log(response, getTranslations()));
}

function switchTranslateDirection() {
    switch(translateDirection) {
        case "English to K'iche'":
            translateDirection = "K'iche' to English";
            langs.from = 'kiche';
            langs.to = 'english';
            break;
        case "K'iche' to English":
            translateDirection = "English to K'iche'";
            langs.from = 'english';
            langs.to = 'kiche';
            break;
        default:
            break;
    }
    document.querySelector('.translate-direction')
        .innerHTML = translateDirection;
    document.querySelector('.translations')
        .innerHTML = ''
            + '<div class="translations-title">'
            + 'Translations'
            + '</div>';
}

function doTranslate() {
    var translateText = document.querySelector('#translate-text').value;
    
    var translations = [];
    for (var i = 0; i < translationPairs.length; i++) {
        if (translationPairs[i][langs.from].includes(translateText)) {
            translations.push(translationPairs[i]);
        }
    }
    translations.sort(compare);
    console.log(translations);
    showTranslations(translations);
    return 'Success';
}

function compare(a,b) {
    if (a[langs.to] < b[langs.to])
      return -1;
    if (a[langs.to] > b[langs.to])
      return 1;
    return 0;
}

function showTranslations(translations) {
    let translationsEl = document.querySelector('.translations');
    while (translationsEl.firstChild) {
        translationsEl.removeChild(translationsEl.firstChild);
    }

    let translationsTitleEl = document.createElement('div');
    translationsTitleEl.classList.add('translations-title');
    translationsTitleEl.innerText = 'Translations';
    translationsEl.appendChild(translationsTitleEl);

    for (let i = 0; i < translations.length; i++) {
        let id = translations[i].id;

        let translationElement = document.createElement('div');
        translationElement.classList.add('translation');
    
        let deleteBtn = document.createElement('span');
        deleteBtn.classList.add('delete-btn');
        deleteBtn.innerHTML = '<b>X</b>';
        deleteBtn.onclick = (event) => 
            deleteTranslationPair(event, id);
        translationElement.appendChild(deleteBtn);

        let langNames = document.createElement('div');
        langNames.classList.add('lang-names');
        translationElement.appendChild(langNames);
        
        let toLangName = document.createElement('div');
        toLangName.classList.add('col');
        toLangName.innerHTML = formatLangName(langs.to);
        langNames.appendChild(toLangName);

        let fromLangName = document.createElement('div');
        fromLangName.classList.add('col');
        fromLangName.innerHTML = formatLangName(langs.from);
        langNames.appendChild(fromLangName);

        let translationText = document.createElement('div');
        translationText.classList.add('translation-text');
        translationElement.appendChild(translationText);
        
        let toLangText = document.createElement('div');
        toLangText.classList.add('col');
        toLangText.innerText = translations[i][langs.to];
        translationText.appendChild(toLangText);

        let editToLangTextBtn = document.createElement('i');
        editToLangTextBtn.classList.add('fas');
        editToLangTextBtn.classList.add('fa-pencil-alt');
        editToLangTextBtn.classList.add('edit-text-btn');
        editToLangTextBtn.dataset.pairid = id;
        editToLangTextBtn.onclick = (event) => editLangText(event, 'to');
        toLangText.appendChild(editToLangTextBtn);

        let fromLangText = document.createElement('div');
        fromLangText.classList.add('col');
        fromLangText.innerText = translations[i][langs.from];
        translationText.appendChild(fromLangText);

        let editFromLangTextBtn = document.createElement('i');
        editFromLangTextBtn.classList.add('fas');
        editFromLangTextBtn.classList.add('fa-pencil-alt');
        editFromLangTextBtn.classList.add('edit-text-btn');
        editFromLangTextBtn.dataset.pairid = id;
        editFromLangTextBtn.onclick = (event) => editLangText(event, 'from');
        fromLangText.appendChild(editFromLangTextBtn);

        let translationExamples = getExamples(translations[i]);
        translationElement.appendChild(translationExamples);

        translationsEl.appendChild(translationElement);
    }
}

function editLangText(event, lang) {
    console.log('Edit lang text', event);

    let pairId = event.target.dataset.pairid;
    let langTextCol = event.target.parentNode;
    let langText = langTextCol.innerText;
    langTextCol.innerText = '';

    let langTextInput = document.createElement('input');
    langTextInput.classList.add('new-example-input');
    langTextInput.value = langText;
    langTextCol.appendChild(langTextInput);
    
    let submitBtn = document.createElement('i');
    submitBtn.classList.add('submit-example-btn');
    submitBtn.classList.add('fas');
    submitBtn.classList.add('fa-check');
    submitBtn.onclick = (event) => submitLangText(event, pairId, lang);
    langTextCol.appendChild(submitBtn);

    let cancelExampleBtn = document.createElement('i');
    cancelExampleBtn.classList.add('cancel-example-btn');
    cancelExampleBtn.classList.add('fas');
    cancelExampleBtn.classList.add('fa-times');
    cancelExampleBtn.onclick = (event) => cancelEditLangText(event, pairId);
    langTextCol.appendChild(cancelExampleBtn);
}

function submitLangText(event, pairId, lang) {
    console.log('Submit', pairId, event);

    let langTextCol = event.target.parentNode;
    let langText = langTextCol.childNodes[0].value;

    if (langText == '') {
        alert('Please enter a valid text value.');
        return;
    }
    langTextCol.innerHTML = langText;

    let translationPair = translationPairsById[pairId];
    if (lang == 'to') translationPair[langs.to] = langText;
    else translationPair[langs.from] = langText;
    updateTranslationPair(translationPair);
    
    let editTextBtn = document.createElement('i');
    editTextBtn.classList.add('fas');
    editTextBtn.classList.add('fa-pencil-alt');
    editTextBtn.classList.add('edit-text-btn');
    editTextBtn.dataset.pairid = pairId;
    editTextBtn.onclick = (event) => editLangText(event);
    langTextCol.appendChild(editTextBtn);
}

function cancelEditLangText(event, pairId) {
    console.log('Cancel', event);

    let langTextCol = event.target.parentNode;
    let langText = langTextCol.childNodes[0].value;
    langTextCol.innerHTML = langText;
    
    let editTextBtn = document.createElement('i');
    editTextBtn.classList.add('fas');
    editTextBtn.classList.add('fa-pencil-alt');
    editTextBtn.classList.add('edit-text-btn');
    editTextBtn.dataset.pairid = pairId;
    editTextBtn.onclick = (event) => editLangText(event);
    langTextCol.appendChild(editTextBtn);
}

function getExamples(translation) {
    let id = translation.id;
    let examplesEl = document.createElement('div');
    examplesEl.classList.add('translation-examples');

    let examplesTitleEl = document.createElement('div');
    examplesTitleEl.classList.add('examples-title');
    examplesTitleEl.innerText = 'Examples';
    examplesEl.appendChild(examplesTitleEl);

    let addIconBtn = document.createElement('i');
    addIconBtn.classList.add('fas');
    addIconBtn.classList.add('fa-plus');
    addIconBtn.classList.add('add-example-btn');
    addIconBtn.dataset.pairId = translation.id;
    addIconBtn.onclick = (event) => {
        let examplesEl = event.target.parentNode.parentNode;
        let pairId = event.target.dataset.pairId;
        addExample(examplesEl, pairId);
    };
    examplesTitleEl.appendChild(addIconBtn);

    examplesEl.appendChild(document.createElement('hr'));

    if (translation.examples == undefined 
        || translation.examples.length < 1) {
        return examplesEl;
    }

    let examples = translation.examples;
    for (var i = 0; i < examples.length; i++) {
        let newExample = buildExampleRow(id, examples[i], i);
        examplesEl.appendChild(newExample);
    }
    return examplesEl;
}

function buildExampleRow(id, example, index) {
    let rowEl = document.createElement('div');
    rowEl.classList.add('row');

    let exampleColEl1 = document.createElement('div');
    exampleColEl1.classList.add('example-col');
    exampleColEl1.innerText = example[langs.to];
    rowEl.appendChild(exampleColEl1);
    
    let exampleColEl2 = document.createElement('div');
    exampleColEl2.classList.add('example-col');
    exampleColEl2.innerText = example[langs.from];
    rowEl.appendChild(exampleColEl2);

    // <i class="fas fa-pencil-alt"></i>
    let editIconBtn = document.createElement('i');
    editIconBtn.classList.add('fas');
    editIconBtn.classList.add('fa-pencil-alt');
    editIconBtn.classList.add('edit-example-btn');
    editIconBtn.dataset.pairid = id;
    editIconBtn.dataset.index = index;
    editIconBtn.onclick = (event) => editExample(event);
    rowEl.appendChild(editIconBtn);
    
    // <i class="fas fa-minus-circle"></i>
    let deleteIconBtn = document.createElement('i');
    deleteIconBtn.classList.add('fas');
    deleteIconBtn.classList.add('fa-trash-alt');
    deleteIconBtn.classList.add('delete-example-btn');
    deleteIconBtn.dataset.pairId = id;
    deleteIconBtn.dataset.index = index;
    deleteIconBtn.onclick = (event) => deleteExample(event);
    rowEl.appendChild(deleteIconBtn);

    return rowEl;
}

function addExample(examplesEl, pairId, initialValues) {
    let toLangExample = '';
    let fromLangExample = '';
    if (initialValues != undefined) {
        toLangExample = initialValues.toLangExample;
        fromLangExample = initialValues.fromLangExample;
    }
    
    let newExampleRow = document.createElement('div');
    newExampleRow.classList.add('row');
    examplesEl.appendChild(newExampleRow);

    let exampleCol1 = document.createElement('div');
    exampleCol1.classList.add('example-col');
    newExampleRow.appendChild(exampleCol1);

    let toLangInput = document.createElement('input');
    toLangInput.classList.add('new-example-input');
    toLangInput.id = 'tolang-example-input';
    toLangInput.type = 'text';
    toLangInput.value = toLangExample;
    toLangInput.autofocus = true;
    exampleCol1.appendChild(toLangInput);

    let exampleCol2 = document.createElement('div');
    exampleCol2.classList.add('example-col');
    newExampleRow.appendChild(exampleCol2);

    let fromLangInput = document.createElement('input');
    fromLangInput.classList.add('new-example-input');
    fromLangInput.id = 'fromlang-example-input';
    fromLangInput.type = 'text';
    fromLangInput.value = fromLangExample;
    exampleCol2.appendChild(fromLangInput);
    console.log(fromLangInput);

    let submitExampleBtn = document.createElement('i');
    submitExampleBtn.classList.add('submit-example-btn');
    submitExampleBtn.classList.add('fas');
    submitExampleBtn.classList.add('fa-check');
    submitExampleBtn.onclick = (event) => submitNewExample(event, pairId);
    exampleCol2.appendChild(submitExampleBtn);
    console.log(toLangInput);

    let cancelExampleBtn = document.createElement('i');
    cancelExampleBtn.classList.add('cancel-example-btn');
    cancelExampleBtn.classList.add('fas');
    cancelExampleBtn.classList.add('fa-times');
    cancelExampleBtn.onclick = (event) => cancelNewExample(event);
    exampleCol2.appendChild(cancelExampleBtn);
}

function cancelNewExample() {
    let row = event.target.parentNode.parentNode;
    let examples = row.parentNode;
    examples.removeChild(row);
}

function submitNewExample(event, pairId) {
    let newFromLangExample = document.querySelector('#fromlang-example-input').value;
    let newToLangExample = document.querySelector('#tolang-example-input').value;
    
    if (newFromLangExample == '' || newToLangExample == '') {
        alert('Please provide valid examples.');
        return;
    }

    let translationPair = translationPairsById[pairId];
    let examples = translationPair.examples;
    let example = {
        kiche: langs.to == 'kiche' ? newToLangExample : newFromLangExample,
        english: langs.from == 'english' ? newFromLangExample : newToLangExample
    }
    examples.push(example);
    updateTranslationPair(translationPair);

    let newExampleRow = buildExampleRow(pairId, example, examples.length-1);

    let exampleInputRow = event.target.parentNode.parentNode;
    let examplesEl = exampleInputRow.parentNode;
    examplesEl.removeChild(exampleInputRow);
    examplesEl.appendChild(newExampleRow);
}

function editExample(event) {
    console.log('Edit', event.target);

    let exampleRow = event.target.parentNode;
    let toLangCol = exampleRow.childNodes[0];
    let toLangText = toLangCol.innerText;
    let fromLangCol = exampleRow.childNodes[1];
    let fromLangText = fromLangCol.innerText;

    let examplesEl = exampleRow.parentNode;
    examplesEl.removeChild(exampleRow);

    let data = event.target.dataset;
    let translationPair = translationPairsById[data.pairid];
    console.log(data, data.pairid, translationPair);
    translationPair.examples.splice(data.index, 1);
    console.log(translationPair.examples);
    updateTranslationPair(translationPair);

    let initialValues = {
        toLangExample: toLangText,
        fromLangExample: fromLangText
    }
    addExample(examplesEl, data.pairid, initialValues);
}

function cancelEditExample(event) {
    console.log('Cancel Edit', event);
}

function submitEditExample(event) {
    console.log('Submit Edit', event);
}

function deleteExample(event) {
    console.log('Delete', event.target);
    let exampleRow = event.target.parentNode;
    let examplesEl = exampleRow.parentNode;
    examplesEl.removeChild(exampleRow);

    if (!event.shiftKey) return;

    let data = event.target.dataset;
    let translationPair = translationPairsById[data.pairId];
    translationPair.examples.splice(data.index, 1);
    console.log(translationPair.examples);
    updateTranslationPair(translationPair);
}

function formatLangName(langName) {
    return langName == 'english' 
        ? '<b>English:</b>' 
        : '<b>K\'iche\':</b>';
}

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

