//////////////////////////////////////////////////////////////////////////////////////////////////
// Поскольку на github серверная сторона не предусмотрена, используем примитивную шаблонизацию, //
// чтобы если что-то поменяется не перебирать все 35 страниц уроков                             //
//////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////
// КАРТА КУРСА (ВЫПАДАЕТ ПРИ НАЖАТИИ НА МЕНЮ) //
////////////////////////////////////////////////
const COURSE_MAP =  
`<div class="chooseLesson">
    <ul>
      <li><a href="index.html">Урок 1. Основные понятия</a></li>
      <li><a href="2.html">Урок 2. Основные понятия, закрепление</a></li>
      <li><a href="3.html">Урок 3. Простейшие реакции</a></li>
      <li><a href="4.html">Урок 4. Не все реакции можно уравнять</a></li>
      <li><a href="5.html">Урок 5. Вначале - индексы</a></li>
      <li><a href="6.html">Урок 6. Реакции посложнее</a></li>
      <li><a href="7.html">Урок 7. Больше практики</a></li>
      <li><a href="8.html">Урок 8. Напутствие</a></li>
      <li><a href="9.html">Урок 9. Степень окисления</a></li>
      <li><a href="10.html">Урок 10. Как находить степени окисления</a></li>
      <li><a href="11.html">Урок 11. Находим степени окисления, больше практики</a></li>
      <li><a href="12.html">Урок 12. Молекулы и ионы. Степени окисления в ионах</a></li>
      <li><a href="13.html">Урок 13. Степени окисления в ионах, больше практики</a></li>
      <li><a href="14.html">Урок 14. Степени окисления в ионах, закрепление</a></li>
      <li><a href="15.html">Урок 15. Металлы с переменной степенью окисления</a></li>
      <li><a href="16.html">Урок 16. Необычные соединения азота. Практика по нахождениям степеней окисления</a></li>
      <li><a href="17.html">Урок 17. Степени окисления, все вместе</a></li>
      <li><a href="18.html">Урок 18. Разница между обычными реакциями и ОВР</a></li>
      <li><a href="19.html">Урок 19. Окислители и восстановители</a></li>
      <li><a href="20.html">Урок 20. Окислители и восстановители, продолжение</a></li>
      <li><a href="21.html">Урок 21. Окислители и восстановители, перенос электронов</a></li>
      <li><a href="22.html">Урок 22. Главный принцип уравнивания ОВР</a></li>
      <li><a href="23.html">Урок 23. Уравниваем электроны. Множители баланса</a></li>
      <li><a href="24.html">Урок 24. Подробнее про множители баланса</a></li>
      <li><a href="25.html">Урок 25. Множители баланса и коэффициенты в уравнении</a></li>
      <li><a href="26.html">Урок 26. Расставляем коэффициенты, практика</a></li>
      <li><a href="27.html">Урок 27. Финальный алгоритм</a></li>
      <li><a href="28.html">Урок 28. Дробные коэффициенты</a></li>
      <li><a href="29.html">Урок 29. Реакции диспропорционирования и сопропорционирования</a></li>
      <li><a href="30.html">Урок 30. Сразу два восстановителя в одной ОВР</a></li>
      <li><a href="31.html">Урок 31. Какой баланс в этой реакции?</a></li>
      <li><a href="32.html">Урок 32. Реакции разложения</a></li>
      <li><a href="33.html">Урок 33. Экзамен</a></li>
      <li><a href="34.html">Урок 34. Финальный босс</a></li>
    </ul>
  </div>`

const HEAD_TMPLT = 
`<meta property="og:url" content="${window.location.href}">
<meta property="og:site_name" content="${window.location.href}">
<meta property="og:image" content="img/shareImg.jpg">
<meta property="og:type" content="artice">
<meta property="og:title" content="${document.title}">
<meta property="og:description" content="${document.querySelector('meta[name="description"]').getAttribute("content")}">
<link href="https://fonts.googleapis.com/css?family=Roboto:400,400i,700,700i&display=swap&subset=cyrillic" rel="stylesheet">`


const BODY_BEFORE_MAIN_CONTENT = 
`<div class="modal">
    <div class="container">
    </div>
  </div>
  <div class="social"><a href="javascript:void(0)" id="vk"><i class="fab fa-vk"></i></a><a href="javascript:void(0)" id="tg"><i class="fab fa-telegram"></i></a><a href="javascript:void(0)" id="twt"><i class="fab fa-twitter"></i></a><a href="javascript:void(0)" id="fb"><i class="fab fa-facebook"></i></a></div>` + document.body.innerHTML;


const BODY_AFTER_MAIN_CONTENT = 
`<div class="lessonNavButtons">
      <div class="button prev">⟵ К предыдущему уроку</div>
      <div class="button next">К следующему уроку ⟶</div>
  </div>
  <footer>
    Материал курса, дизайн, верстка, код - <a href="https://vk.com/id66548870" target="_blank">Андрей Фирсов</a>.</br>Все права защищены. Полное или частичное копирование курса в любых целях запрещено и преследуется по закону.  
  </footer>`;

const BODY_AFTER_MAIN_CONTENT_LAST = 
`<footer>
  Материал курса, дизайн, верстка, код - <a href="mailto:afirsov410@gmail.com">Андрей Фирсов</a>.</br>Все права защищены. Полное или частичное копирование курса в любых целях запрещено и преследуется по закону.  
</footer>` 

document.head.innerHTML += HEAD_TMPLT;
document.body.innerHTML = BODY_BEFORE_MAIN_CONTENT;
document.body.innerHTML += currentLesson == 35 ? BODY_AFTER_MAIN_CONTENT_LAST : BODY_AFTER_MAIN_CONTENT;


  [
  './js/exercizes.js',
  './js/reaction.js',
  './js/inputs.js',
  './js/reactiontree.js',
  './js/matrix.js',
  './js/reactiontables.js',
  './js/redoxbalance.js',
  './js/main.js'
].forEach(function(src) {
  const script = document.createElement('script');
  script.src = src;
  script.async = false;
  document.head.appendChild(script);
});
