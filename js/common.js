//в этом файле общие константы и вспомогательные функции

///////////////////////
// ЗАМЕНИТЬ НА ПРОДЕ //
///////////////////////

const DOMEN = location.hostname;

//после тестов заменить max-age=${1*365*24*60*60}
if (!document.cookie) {
  document.cookie = `domen=${DOMEN};path=/;lastSolvedLesson=2;max-age=${1*365*24*60*60}`;
}

const lastSolvedLesson = +(new Map(document.cookie.split(';').map(x => x.trim().split('=')))).get('lastSolvedLesson') || 2;
console.log(lastSolvedLesson);

// Задаем механику поведения кнопки Далее
// при клике - октрыть html со следующим номером
const path = [...window.location.pathname];
//находим номер последнего слэша в адресе текущего документа
const lastSlash = path.reduce( (sum, current, i) => {
  if (current == "/") return i;
  else return sum; 
}, 0);

//все уроки названы в формате: ${currentLesson}.html, получаем по пути currentLesson
const currentLesson = parseFloat(path.slice(lastSlash).filter(x => !isNaN(x)).join("")) || 1;


////////////////////////////////////////////////////////////////////////////////////////////////////////
// РАСКОММЕНТИТЬ НА ПРОДЕ                                                                             //
if (currentLesson > lastSolvedLesson + 1 && !path.includes('demo')) document.location.href = `${lastSolvedLesson + 1}.html`; //
////////////////////////////////////////////////////////////////////////////////////////////////////////



//общее для всех реакций обозначение стрелки
const ARROW = "⟶";
//HTML код для обозначения электрона
const electron = "e<sup>-</sup>"



//////////////////////////////////////////////////////////////
//функции по работе с текстом                               //
//////////////////////////////////////////////////////////////
//заменяем разные видок стрелок фирстильной стрелкой ARROW  
function substituteArrow(reaction) {
  return reaction.replace(/[=⇒⟶➝⟶➝➞→]/gi, ARROW);
}
//true, если текущий символ - лаитиница, иначе false
function isLatin(symbol) {
  return /[a-z]/i.test(symbol);
}
//true, если текущий символ используется в записи реакций, иначе false
function isReaction(symbol) {
  return /[⟶a-z⇒()01-9 +\-=\[\]]/i.test(symbol);
}
//true, если текущий символ используется в записи реакций и может начинать реакцию, иначе false
function fromReaction(symbol) {
  return /[(1-9\[]/i.test(symbol);
}
//true, если текущий символ используется в записи реакций и но НЕ МОЖЕТ заканчивать реакцию, иначе false
function notFromReaction(symbol) {
  return /[( \s []/i.test(symbol);
}
//true, если текущий символ - заглавная лаитиница, иначе false
function isCapitalLatin(symbol) {
    return /[A-Z]/.test(symbol);
}
//возвращает объект с координатами объекта относительно документа
function getCoords(elem) {
  const box = elem.getBoundingClientRect();
  return {
    top: box.top + pageYOffset,
    left: box.left + pageXOffset
  }
}
//вовзращает символ нажатой клавиши (для keydown) для любых браузеров
function getChar(event) {
 if (event.which == null) {
   if (event.keyCode < 32) return null;
   return String.fromCharCode(event.keyCode) // IE
 }
 if (event.which != 0 && event.charCode != 0) {
   if (event.which < 32) return null;
   return String.fromCharCode(event.which) // остальные
 }
 return null; // специальная клавиша
}

////////////////////////////////////////////////////////////////////
// функции по выравниванию на странице                            //
//пока нигде не используются, но мало ли..                        //
////////////////////////////////////////////////////////////////////
//выравниет posElem по центру по горизонтали относительно refElem //
function alignCenterX(refElem, posElem) {
  posElem.style.left = getCoords(refElem).left + (refElem.offsetWidth - posElem.offsetWidth) / 2 + "px";
}
//выравниет posElem по центру по вертикали относительно refElem
function alignCenterY(refElem, posElem) {
  posElem.style.top = getCoords(refElem).top + (refElem.offsetHeight - posElem.offsetHeight) / 2 + "px";
}

///////////////////////////////////////////////
// функции по работе с DOM общего назначения //
///////////////////////////////////////////////
//возвращает всех предшедствующих сиблингов у того же родителя (включая текстовые узлы)
function getPreviousSiblings(element) {
  const siblings = [...element.parentElement.childNodes];
  const nodesBeforeElement = siblings.slice(0, siblings.indexOf(element));
  return nodesBeforeElement;
}
//возвращает всех идущих после сиблингов у того же родителя (включая текстовые узлы)
function getNextSiblings(element) {
  const siblings = [...element.parentElement.childNodes];
  const nodesAfterElement = siblings.slice(siblings.indexOf(element));
  return nodesAfterElement; 
}
//нужно для предотвращения копирования-вставки
function preventPasteSelect(e) {
  e.preventDefault();
  return false;
}
//блокирует элеменент: делает его полупрозрачным и запрещающий курсор над ним
function blockElem(elem) {
  elem.classList.add('inactive');
  //внутренний флаг "выключенного" состояния элемента
  elem._disabled = true;
}
//разблокирует элеменент    
function unblockElem(elem) {
  elem.classList.remove('inactive');
  elem._disabled = false;
}



///////////////////////////
// итератор для объектов //
///////////////////////////
//делаем все объекты итерабельными
makeIterable(Object.prototype);
//делает obj итерабельным
function makeIterable(obj) {
  obj[Symbol.iterator] = function () {
    var _this = this;
    var keys = null;
    var index = 0;
    
    return {
      next: function () {
        if (keys === null) {
          keys = Object.keys(_this).sort();
        }
        
        return {
          value: keys[index], done: index++ >= keys.length
        };
      }
    }
  } 
}



//добавляет TR к таблице и возвращает его
function addRow(table, className) {
  const tr = document.createElement('tr');
  table.append(tr);
  if (className) tr.className = className;
  return tr;
}
//добавляет ячейку TD к tr и возвращает ее 
function addCell(tr, text="", className) {
  const td = document.createElement('td');
  tr.append(td);
  td.innerHTML = text;
  if (className) td.className = className;
  return td;
}
//
function addHeadCell(tr, text="", className) {
  const th = document.createElement('th');
  tr.append(th);
  th.innerHTML = text;
  if (className) th.className = className;
  return th;
}

//оборачивает элемент ссылкой
function coverLink(elem, href) {
  const a = document.createElement('a');
  a.href = href;
  coverElem(elem, a);
}

//покрывает элемент elem элементом coverageElem, вставляет elem в конец coverageElem 
function coverElem(elem, coverageElem) {
  elem.before(coverageElem);
  coverageElem.append(elem);
}

function coverWithSpan(elem, className) {
  if (!elem) return;
  //elem.matches('.electrons') && elem.textContent.slice(0, elem.textContent.indexOf('e'))   - это условие означает следующее: если у ячейки есть текст и внем содержится
  //буква 'e' (справедливо для ячеек с электронами), то взять из текста то, что до буквы 'е'.
  const spanHTML = `<span class="${className}">${elem.matches('.electrons') && elem.textContent.slice(0, elem.textContent.indexOf('e')) || elem.textContent || elem.value || ' '}</span>`
  // сейчас просто добавляет класс к элементу, не заворичавая его текст в спан
  console.log(elem, !(elem.matches('input') || elem.matches('.electrons')))
  if (!(elem.matches('input') || elem.matches('.electrons'))) {
    console.log(elem);
    elem.innerHTML = spanHTML;
  }
  else {
    console.log(elem);
    elem.classList.add(className)
  };
  return spanHTML;
}
//возвращает массив из заспаненных содержимых элементов из elemArr, а также оборачивает содержимое каждой ячейки в <span.hl${i}> 
function coverRangeWithSpan(elemArr) {
  let result = [];
  elemArr.forEach( (elem, i) => {
    if (!elem) return;
    result.push(coverWithSpan(elem, `hl${i % 3}`));
  });
  return result;
}

function chargeToDigit(chargeTxt) {
  if (chargeTxt == '') return 0;
  else if (chargeTxt == '-') return -1;
  else if (chargeTxt == '+') return 1;
  else {
    const val = parseInt(chargeTxt);
    return val * ((chargeTxt.includes('-') && val > 0) ? -1 : 1);
  }
}

function explicitShowPlus(value) {
  if (value > 0) return `+${value}`;
  else return value;
}

//ищет наибольший общий делить для всех чисел из массива arr и сокращает их на него
function cutToCoprime(arr) {
  const min = Math.min(...arr);
  console.log(min);
  let result = [];
  
  for (let i = min; i > 1; i--) {
    result = []; 
    
    for (let x of arr) {
      if (x % i != 0) break;
      result.push(x / i);
    }

    if (result.length == arr.length) break;
  }

  return (result.length == arr.length) ? result : arr;
}

//октрывашка для страниц поделиться в соц сетях 
function genericSocialShare(url) {
    window.open(url,'sharer','toolbar=0,status=0,width=648,height=395');
    return true;
}


function getScrollBarWidth() {
  let div = document.createElement('div');

  div.style.overflowY = 'scroll';
  div.style.width = '50px';
  div.style.height = '50px';

  // мы должны вставить элемент в документ, иначе размеры будут равны 0
  document.body.append(div);
  let scrollWidth = div.offsetWidth - div.clientWidth;

  div.remove();

  return scrollWidth;
}

//для добавления миксинов
function classMixin(cls, ...src) {
    for (let _cl of src) {
        for (var key of Object.getOwnPropertyNames(_cl.prototype)) {
          cls.prototype[key] = _cl.prototype[key]
        }
    }
}