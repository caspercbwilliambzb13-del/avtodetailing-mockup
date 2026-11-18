(() => {
  'use strict';

  const KEYS = {
    settings: 'gloss-settings-v1', orders: 'gloss-orders-v1', cart: 'gloss-cart-v1',
    draft: 'gloss-draft-v1', theme: 'gloss-theme-v1'
  };
  const statuses = {
    new: 'Новая', agreed: 'Согласована', inProgress: 'В работе', completed: 'Завершена', cancelled: 'Отменена'
  };
  const defaultSettings = {
    company: { name: 'АвтоБлеск', address: 'ул. Примерная, 12', phone: '+7 (900) 000-00-00', accent: '#e7f05a' },
    password: '1234', multipliers: { sedan: 1, crossover: 1.2, suv: 1.4 },
    classes: [
      { id: 'sedan', name: 'Седан', factor: '×1', silhouette: 'sedan' },
      { id: 'crossover', name: 'Кроссовер', factor: '×1,2', silhouette: 'crossover' },
      { id: 'suv', name: 'Внедорожник / минивэн', factor: '×1,4', silhouette: 'suv' }
    ],
    services: [
      { id: 'wash', name: 'Детейлинг-мойка', description: 'Бережная ручная мойка, очистка дисков и защитный финиш.', icon: '✦', variants: [{ name: 'Стандарт', min: 2500, max: 3500 }] },
      { id: 'interior', name: 'Химчистка салона', description: 'Локальная чистка или глубокая обработка всех поверхностей.', icon: '◌', variants: [{ name: 'Локальная', min: 5000, max: 9000 }, { name: 'Полная', min: 18000, max: 23000 }] },
      { id: 'polish', name: 'Полировка кузова', description: 'Восстановление блеска и снижение видимости мелких царапин.', icon: '◈', variants: [{ name: 'Лёгкая', min: 15000, max: 22000 }, { name: 'Восстановительная', min: 25000, max: 35000 }] },
      { id: 'ceramic', name: 'Керамическое покрытие', description: 'Защитный состав и гидрофобный эффект после подготовки кузова.', icon: '◇', variants: [{ name: '1 слой', min: 35000, max: 48000 }] },
      { id: 'film', name: 'Оклейка плёнкой', description: 'Стоимость и объём работ мастер определит по фотографиям.', icon: '▱', variants: [{ name: 'Расчёт по фото', min: 0, max: 0 }] },
      { id: 'leather', name: 'Чистка кожи', description: 'Очистка, мягкая кондиционирующая обработка и матовый финиш.', icon: '◍', variants: [{ name: 'Салон', min: 6500, max: 11000 }] },
      { id: 'ozone', name: 'Озонация салона', description: 'Дополнительная обработка салона от стойких запахов.', icon: '◎', variants: [{ name: 'Обработка', min: 3500, max: 5500 }] }
    ],
    packages: [
      { id: 'pkg-wash', name: 'Мойка + салон', description: 'Детейлинг-мойка и уход за основными поверхностями салона.', icon: '✦', variants: [{ name: 'Комфорт', min: 9900, max: 14900 }] },
      { id: 'pkg-ceramic', name: 'Полировка + керамика', description: 'Подготовка кузова, полировка и защитный керамический слой.', icon: '◈', variants: [{ name: 'Комплекс', min: 29900, max: 39900 }] },
      { id: 'pkg-full', name: 'Полный комплекс', description: 'Кузов и салон: состав работ уточняется после осмотра автомобиля.', icon: '⬡', variants: [{ name: 'Подбор мастером', min: 39900, max: 59900 }] }
    ],
    gallery: [
      { id: 'work-1', title: 'Восстановление блеска кузова', text: 'Демо-сравнение этапов полировки на графическом силуэте. Результат зависит от состояния лака.', service: 'Полировка', guarantee: 'Керамика: гарантия обсуждается по выбранному составу', finish: 52 },
      { id: 'work-2', title: 'Защитный слой и уход', text: 'Иллюстрация эффекта чистого и защищённого покрытия. Это схема, а не фотография реального автомобиля.', service: 'Защита кузова', guarantee: 'Плёнка: срок гарантии указывается в договорённости с мастером', finish: 62 }
    ]
  };

  const app = document.querySelector('#app');
  const toastNode = document.querySelector('#toast');
  const moveDialog = document.querySelector('#move-dialog');
  const moveForm = document.querySelector('#move-form');
  const read = (key, fallback) => {
    try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; }
    catch { return fallback; }
  };
  const save = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { showToast('Браузер не смог сохранить данные. Проверьте настройки хранилища.'); } };
  let settings = Object.assign(structuredClone(defaultSettings), read(KEYS.settings, {}));
  settings.company = Object.assign({}, defaultSettings.company, settings.company || {});
  settings.multipliers = Object.assign({}, defaultSettings.multipliers, settings.multipliers || {});
  settings.services = settings.services?.length ? settings.services : structuredClone(defaultSettings.services);
  settings.packages = settings.packages?.length ? settings.packages : structuredClone(defaultSettings.packages);
  settings.classes = settings.classes?.length ? settings.classes : structuredClone(defaultSettings.classes);
  settings.gallery = Array.isArray(settings.gallery) ? settings.gallery : structuredClone(defaultSettings.gallery);
  let orders = read(KEYS.orders, []);
  let cart = read(KEYS.cart, []);
  let draft = Object.assign({ name: '', phone: '', make: '', model: '', plate: '', date: '', time: '', post: '', comment: '', consent: false, photoNames: [] }, read(KEYS.draft, {}));
  let photoPreviews = [];
  let selectedClass = draft.vehicleClass || 'sedan';
  let mode = 'client';
  let ownerAuthed = false;
  let ownerSection = 'orders';
  let clientSection = 'booking';
  let latestOrderId = '';
  let ownerSearch = '';
  let ownerStatus = 'all';
  let customerLookup = '';
  let compareValue = 52;
  let deferredInstallPrompt = null;
  let toastTimer;

  const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const money = (value) => Number(value || 0).toLocaleString('ru-RU') + ' ₽';
  const safeDate = (date) => date ? new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', weekday: 'short' }).format(new Date(`${date}T12:00:00`)) : 'Не выбрано';
  const dateISO = (offset) => { const date = new Date(); date.setDate(date.getDate() + offset); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; };
  const normalizePhone = (phone) => String(phone || '').replace(/\D/g, '').replace(/^8(?=\d{10}$)/, '7');
  const currentClass = () => settings.classes.find((item) => item.id === selectedClass) || settings.classes[0];
  const allItems = () => [...settings.services, ...settings.packages];
  const itemById = (id) => allItems().find((item) => item.id === id);
  const variantFor = (item, variantName) => item?.variants.find((variant) => variant.name === variantName) || item?.variants[0];
  const priceFor = (item, variant, factor = Number(settings.multipliers[selectedClass] || 1)) => ({
    min: Math.round((Number(variant?.min) || 0) * factor), max: Math.round((Number(variant?.max) || 0) * factor)
  });
  const cartRange = () => cart.reduce((total, entry) => {
    const item = itemById(entry.itemId); const variant = variantFor(item, entry.variant);
    if (item?.id === 'film') return total;
    const range = priceFor(item, variant);
    return { min: total.min + range.min, max: total.max + range.max };
  }, { min: 0, max: 0 });
  const hasPhotoQuote = (entries = cart) => entries.some((entry) => entry.itemId === 'film');
  const statusClass = (status) => ({ new: 'status-new', agreed: 'status-agreed', inProgress: 'status-in-progress', completed: 'status-completed', cancelled: 'status-cancelled' })[status] || '';
  const statusBadge = (status) => `<span class="status-badge ${statusClass(status)}">${escapeHTML(statuses[status] || statuses.new)}</span>`;
  const saveDraft = () => { draft.vehicleClass = selectedClass; save(KEYS.draft, draft); };
  const showToast = (message) => {
    toastNode.textContent = message; toastNode.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { toastNode.hidden = true; }, 3400);
  };
  const carSvg = (kind = 'sedan', className = 'car-art') => {
    const roof = kind === 'suv' ? '150 202 223 137 390 137 451 202' : kind === 'crossover' ? '151 202 225 151 378 151 438 202' : '160 202 225 159 371 159 430 202';
    const bodyTop = kind === 'suv' ? 137 : kind === 'crossover' ? 151 : 159;
    return `<svg class="${className}" viewBox="0 0 600 330" role="img" aria-label="Схематичный силуэт автомобиля">
      <defs><linearGradient id="carPaint" x1=".15" y1="0" x2=".9" y2="1"><stop stop-color="var(--accent)" stop-opacity=".88"/><stop offset="1" stop-color="var(--accent)" stop-opacity=".37"/></linearGradient><linearGradient id="carGlass" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#d6e2da" stop-opacity=".7"/><stop offset="1" stop-color="#62736a" stop-opacity=".3"/></linearGradient></defs>
      <ellipse cx="302" cy="266" rx="226" ry="24" fill="#000" opacity=".26"/><path d="M80 230c9-24 23-37 53-43l${roof.split(' ').join(' ')}c19 5 42 17 56 37l14 17H80Z" fill="url(#carPaint)" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round"/>
      <path d="M${kind === 'suv' ? 223 : 225} ${bodyTop + 8}h${kind === 'suv' ? 167 : 153}l47 51H${kind === 'suv' ? 174 : 181}Z" fill="url(#carGlass)" opacity=".78"/><path d="M88 231h430c-5 26-23 42-54 44H126c-20-4-33-18-38-44Z" fill="#bbc6b2" opacity=".65"/><path d="M90 230h420" stroke="#f5f7e7" stroke-width="3" opacity=".72"/><path d="M107 246h33m333 0h25" stroke="#fff2ad" stroke-width="7" stroke-linecap="round"/>
      <circle cx="172" cy="266" r="36" fill="#111512" stroke="#c5d0c4" stroke-width="5"/><circle cx="172" cy="266" r="16" fill="#778379"/><circle cx="430" cy="266" r="36" fill="#111512" stroke="#c5d0c4" stroke-width="5"/><circle cx="430" cy="266" r="16" fill="#778379"/><path d="M239 245h127" stroke="#eff2db" stroke-width="3" opacity=".5"/>
    </svg>`;
  };
  const trustIcon = (icon) => `<span class="trust-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="${icon}"/></svg></span>`;
  const serviceCard = (item, packageCard = false) => {
    const first = item.variants[0]; const range = priceFor(item, first);
    const initialPrice = item.id === 'film' ? 'по фото' : `${money(range.min)}${range.max !== range.min ? `–${money(range.max)}` : ''}`;
    return `<article class="service-card ${packageCard ? 'package-card' : ''}">
      <div class="service-top"><span class="service-symbol" aria-hidden="true">${escapeHTML(item.icon || '◇')}</span><span class="service-price">от ${initialPrice}</span></div>
      <h4>${escapeHTML(item.name)}</h4><p>${escapeHTML(item.description)}</p>
      <div class="service-controls"><label class="sr-only" for="variant-${escapeHTML(item.id)}">Вариант: ${escapeHTML(item.name)}</label><select id="variant-${escapeHTML(item.id)}" data-variant-select="${escapeHTML(item.id)}">${item.variants.map((variant) => `<option value="${escapeHTML(variant.name)}">${escapeHTML(variant.name)}</option>`).join('')}</select><button type="button" class="button button-secondary button-small" data-add="${escapeHTML(item.id)}">Добавить</button></div>
    </article>`;
  };
  const classCard = (item) => `<button type="button" class="class-card ${selectedClass === item.id ? 'is-selected' : ''}" data-class="${escapeHTML(item.id)}" aria-pressed="${selectedClass === item.id}">${carSvg(item.silhouette, '')}<strong>${escapeHTML(item.name)}</strong><span>${escapeHTML(item.factor)}</span></button>`;
  const compareIllustration = () => `<svg class="compare-scene demo-illustration" viewBox="0 0 600 300" role="img" aria-label="Схематичное сравнение матового и отполированного автомобиля"><defs><linearGradient id="demoBg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#303a34"/><stop offset="1" stop-color="#171d19"/></linearGradient></defs><rect width="600" height="300" fill="url(#demoBg)"/><path d="M0 227h600" stroke="#8f9b91" opacity=".23"/><ellipse cx="303" cy="229" rx="222" ry="20" fill="#000" opacity=".35"/><g transform="translate(30 35)"><path class="car-body" d="M73 157c12-23 25-33 56-38l59-59h161l62 59c27 5 42 17 51 38l11 29H62Z"/><path class="car-highlight" d="m196 67 154 0 50 52H144Z"/><path class="glass" d="m198 70-48 46h93V70Zm10 0v46h127V70Zm138 0v46h54l-44-46Z"/><path class="shine" d="M130 150h336M192 147l44-74m111 74-44-74"/><circle class="wheel" cx="170" cy="183" r="30"/><circle class="wheel" cx="394" cy="183" r="30"/></g></svg>`;
  const compareFrame = (finish = compareValue, id = 'featured') => `<div class="compare-frame" data-compare-frame="${escapeHTML(id)}" style="--compare:${Number(finish)}%">${compareIllustration()}<div class="compare-after">${compareIllustration()}</div><span class="compare-label before">ДО · схема</span><span class="compare-label after">ПОСЛЕ · схема</span><div class="compare-line"><span class="compare-knob" aria-hidden="true">↔</span></div><input class="compare-range" type="range" min="8" max="92" value="${Number(finish)}" aria-label="Ползунок сравнения до и после" data-compare="${escapeHTML(id)}"></div>`;
  const renderGalleryCard = (work, index = 0) => `<section class="gallery-feature" aria-label="Демо-работа ${escapeHTML(work.title)}">${compareFrame(work.finish || 52, work.id || `gallery-${index}`)}<div class="gallery-copy"><span class="eyebrow">Галерея · демо</span><h3>${escapeHTML(work.title)}</h3><p>${escapeHTML(work.text)}</p><div class="gallery-meta"><span class="meta-chip">${escapeHTML(work.service || 'Детейлинг')}</span><span class="meta-chip">Без реальных фото</span></div><p class="demo-disclaimer">${escapeHTML(work.guarantee || '')}</p></div></section>`;

  const dayOptions = () => [1, 2, 3].map((offset) => ({ date: dateISO(offset), label: safeDate(dateISO(offset)) }));
  const busyBookings = (date, time) => orders.filter((order) => order.date === date && order.time === time && !['cancelled', 'completed'].includes(order.status));
  const availablePosts = (date, time) => ['Пост 1', 'Пост 2', 'Пост 3'].filter((post) => !busyBookings(date, time).some((order) => order.post === post));
  const scheduleMarkup = () => {
    const days = dayOptions();
    if (!days.some((day) => day.date === draft.date)) { draft.date = days[0].date; draft.time = ''; draft.post = ''; saveDraft(); }
    const activeDate = days.find((day) => day.date === draft.date) || days[0];
    const slots = ['10:00', '13:00', '16:00', '18:00'];
    const slotCards = slots.map((time) => {
      const free = availablePosts(activeDate.date, time); const full = free.length === 0;
      return `<button class="slot-button ${draft.time === time ? 'is-selected' : ''} ${full ? 'is-full' : ''}" type="button" data-time="${time}" ${full ? 'disabled' : ''} aria-pressed="${draft.time === time}"><strong>${time}</strong><span>${full ? 'Все посты заняты' : `${free.length} из 3 постов свободно`}</span></button>`;
    }).join('');
    const posts = draft.time ? availablePosts(activeDate.date, draft.time) : [];
    if (draft.post && !posts.includes(draft.post)) draft.post = posts[0] || '';
    return `<div class="field-grid"><label class="field"><span>День для записи</span><select name="date" data-draft>${days.map((day) => `<option value="${day.date}" ${day.date === activeDate.date ? 'selected' : ''}>${escapeHTML(day.label)}</option>`).join('')}</select></label><div class="field"><span>Свободные посты</span><small>Запись на 1–3 дня вперёд</small></div></div><div class="slot-grid">${slotCards}</div><div class="field" style="margin-top:12px"><label class="field-label" for="booking-post">Пост</label><select id="booking-post" name="post" data-draft ${posts.length ? '' : 'disabled'}><option value="">${posts.length ? 'Выберите пост' : 'Сначала выберите время'}</option>${posts.map((post) => `<option value="${post}" ${draft.post === post ? 'selected' : ''}>${post}</option>`).join('')}</select></div><div class="availability-key"><span><i></i>Свободно</span><span class="busy"><i></i>Занято</span></div>`;
  };
  const cartMarkup = () => {
    const range = cartRange();
    const items = cart.map((entry, index) => {
      const item = itemById(entry.itemId); if (!item) return '';
      const variant = variantFor(item, entry.variant); const price = priceFor(item, variant);
      const value = item.id === 'film' ? 'по фото' : `${money(price.min)}${price.max !== price.min ? `–${money(price.max)}` : ''}`;
      return `<li class="cart-item"><span class="cart-name">${escapeHTML(item.name)}</span><span class="cart-cost">${value}</span><label class="sr-only" for="cart-${index}">Вариант: ${escapeHTML(item.name)}</label><select class="cart-variant" id="cart-${index}" data-cart-variant="${index}">${item.variants.map((option) => `<option value="${escapeHTML(option.name)}" ${option.name === variant.name ? 'selected' : ''}>${escapeHTML(option.name)}</option>`).join('')}</select><button class="cart-remove" type="button" data-remove="${index}">Убрать</button></li>`;
    }).join('');
    const displayed = range.min === range.max ? money(range.min) : `${money(range.min)}–${money(range.max)}`;
    const quoteSuffix = hasPhotoQuote() ? `${range.max ? ' + ' : ''}по фото` : '';
    const totalLabel = hasPhotoQuote() && !range.max ? 'Стоимость' : 'К оплате';
    return `<aside class="booking-aside"><section class="summary-card" id="cart"><div class="summary-heading"><h3>Ваш заказ</h3><span class="count-pill">${cart.length}</span></div>${items ? `<ul class="cart-list">${items}</ul>` : '<p class="empty-cart">Добавьте услугу или пакет — здесь появится расчёт.</p>'}<div class="summary-total"><span>${totalLabel}</span><strong>${cart.length ? `${displayed}${quoteSuffix}` : displayed}</strong></div><p class="summary-range">Предварительная стоимость · ${escapeHTML(currentClass().name)}${hasPhotoQuote() ? ' · стоимость оклейки определит мастер по фото' : ''}</p><p class="payment-note"><strong>Онлайн-оплаты нет.</strong> Предоплата 30% обсуждается с мастером после согласования работ.</p><button type="button" class="button button-primary" data-scroll-booking ${cart.length ? '' : 'disabled'}>Оформить заявку</button></section><div class="mini-contact"><strong>${escapeHTML(settings.company.name)}</strong><p>${escapeHTML(settings.company.address)} · ${escapeHTML(settings.company.phone)}</p><span class="demo-label">Демо-контакты</span></div></aside>`;
  };
  const bookingForm = () => `<form id="booking-form" class="step-panel" novalidate><div class="step-heading"><span class="step-number">4</span><div><h3>Оформление заявки</h3><p>Мастер свяжется с вами и подтвердит стоимость и время.</p></div></div>
    <div class="field-grid">
      <label class="field"><span>Имя</span><input name="name" autocomplete="name" placeholder="Например, Анна" value="${escapeHTML(draft.name)}" data-draft required></label>
      <label class="field"><span>Телефон</span><input name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+7 900 000-00-00" value="${escapeHTML(draft.phone)}" data-draft required></label>
      <label class="field"><span>Марка автомобиля</span><input name="make" autocomplete="off" placeholder="Например, BMW" value="${escapeHTML(draft.make)}" data-draft required></label>
      <label class="field"><span>Модель</span><input name="model" autocomplete="off" placeholder="Например, X5" value="${escapeHTML(draft.model)}" data-draft required></label>
      <label class="field"><span>Госномер <small>необязательно</small></span><input name="plate" autocomplete="off" placeholder="А 000 АА 000" value="${escapeHTML(draft.plate)}" data-draft></label>
      <div class="field"><span>Класс автомобиля</span><p class="booking-note">${escapeHTML(currentClass().name)} · коэффициент ${escapeHTML(currentClass().factor)}</p></div>
      <div class="field field-full"><span class="field-label">Дата и время</span>${scheduleMarkup()}</div>
      <div class="field field-full"><span class="field-label">Фото автомобиля <small>до 3 файлов · только в этой вкладке</small></span><label class="file-drop"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M12 16V4m0 0L8 8m4-4 4 4M4 15v4h16v-4" stroke-linecap="round" stroke-linejoin="round"/></svg><strong>Выбрать фотографии</strong><span>Превью удалится при перезагрузке; в заявке сохранится имя файла</span><input type="file" name="photos" accept="image/*" multiple data-photos aria-label="Выбрать до трёх фотографий автомобиля"></label><div class="photo-previews">${photoPreviews.map((photo) => `<div class="photo-preview"><img src="${photo.data}" alt="Предпросмотр ${escapeHTML(photo.name)}" width="82" height="76"><span>${escapeHTML(photo.name)}</span></div>`).join('')}</div><p class="photo-file-list">${draft.photoNames.length ? `Файлы в черновике: ${draft.photoNames.map(escapeHTML).join(', ')}` : 'Файлы не добавлены.'}</p></div>
      <label class="field field-full"><span>Комментарий <small>необязательно</small></span><textarea name="comment" placeholder="Опишите пожелания или известные особенности автомобиля…" data-draft>${escapeHTML(draft.comment)}</textarea></label>
      <label class="consent-row field-full"><input type="checkbox" name="consent" ${draft.consent ? 'checked' : ''} data-draft required><span>Согласен(на) на обработку контактных данных для ответа на заявку. Учебный макет: данные сохраняются только в localStorage этого браузера.</span></label>
    </div><p class="booking-note">Минимальный заказ — детейлинг-мойка. Сушка после отдельных работ занимает 12–24 часа; точный срок подскажет мастер.</p><p class="form-error" id="form-error" aria-live="polite"></p><div class="form-submit-row"><button class="button button-primary" type="submit" ${cart.length ? '' : 'disabled'}>Отправить заявку</button><span>Без онлайн-оплаты · цена предварительная</span></div></form>`;
  const customerOrderCards = (foundOrders) => foundOrders.map((order) => `<article class="order-card"><div class="order-top"><div><h3>Заявка ${escapeHTML(order.id)}</h3><p>${escapeHTML(order.createdLabel || '')}</p></div>${statusBadge(order.status)}</div><div class="order-details"><div class="order-detail"><span>Автомобиль</span><strong>${escapeHTML([order.make, order.model].filter(Boolean).join(' '))} · ${escapeHTML(order.vehicleClassName || '')}</strong></div><div class="order-detail"><span>Запись</span><strong>${escapeHTML(safeDate(order.date))}, ${escapeHTML(order.time || 'время не выбрано')}</strong></div><div class="order-detail"><span>Итоговая цена</span><strong>${order.finalPrice ? money(order.finalPrice) : (order.hasPhotoQuote && !(order.estimate?.max) ? 'уточняется по фото' : `${money(order.estimate?.min || 0)}–${money(order.estimate?.max || 0)} · ориентир${order.hasPhotoQuote ? ' + по фото' : ''}`)}</strong></div></div>${order.status === 'new' ? '<p class="order-note-client">Заявка на согласовании. Мастер уточнит стоимость и подтвердит время.</p>' : ''}${order.status === 'agreed' ? '<p class="order-note-client">Мастер согласовал цену и время. Если нужно перенести запись, свяжитесь со студией.</p>' : ''}${order.status === 'inProgress' ? '<p class="order-note-client">Автомобиль в работе. Срок сушки отдельных покрытий — 12–24 часа.</p>' : ''}${order.status === 'completed' ? '<p class="order-note-client">Работа завершена. Спасибо, что выбрали «АвтоБлеск».</p>' : ''}</article>`).join('');
  const clientOrdersView = () => {
    const foundOrders = orders.filter((order) => customerLookup && (order.id.toLowerCase() === customerLookup.trim().toLowerCase() || normalizePhone(order.phone) === normalizePhone(customerLookup)));
    return `<section class="section-block"><div class="section-heading"><div><span class="eyebrow">Заявки</span><h2>Мои заявки</h2></div><p>Введите телефон, указанный в форме, или номер заявки. Данные доступны только в этом браузере.</p></div><form class="requests-toolbar" id="lookup-form"><label class="field"><span>Номер заявки или телефон</span><input name="lookup" autocomplete="off" placeholder="Например, GD-260117-4821 или +7 900…" value="${escapeHTML(customerLookup)}"></label><button class="button button-primary" type="submit">Найти заявку</button></form>${customerLookup ? (foundOrders.length ? `<div class="order-list">${customerOrderCards(foundOrders)}</div>` : '<div class="empty-state"><strong>Заявки не найдены</strong>Проверьте телефон или номер и попробуйте ещё раз.</div>') : '<div class="empty-state"><strong>Пока ничего не искали</strong>Укажите телефон или номер заявки, чтобы увидеть статус.</div>'}</section>`;
  };
  const renderClient = () => {
    const gallery = settings.gallery[0] ? renderGalleryCard(settings.gallery[0]) : renderGalleryCard(defaultSettings.gallery[0]);
    app.innerHTML = `<section class="hero"><div class="hero-copy"><span class="eyebrow">Студия ухода за автомобилем</span><h1>Чистый блеск.<span>Точная забота.</span></h1><p>Детейлинг в спокойном ритме: выберите услугу, класс автомобиля и удобное время. Стоимость предварительная — финальную подтвердит мастер.</p><div class="hero-actions"><a class="button button-primary" href="#booking">Подобрать услугу <span aria-hidden="true">↘</span></a><button class="button button-secondary" type="button" data-client-tab="orders">Мои заявки</button></div><div class="hero-facts"><div class="hero-fact"><strong>12–24 часа</strong><span>сушка покрытий</span></div><div class="hero-fact"><strong>3 поста</strong><span>для записи</span></div><div class="hero-fact"><strong>30%</strong><span>предоплата обсуждается</span></div></div></div><div class="hero-visual">${carSvg('crossover')}<div class="hero-sticker"><strong>АвтоБлеск</strong><br>студия</div></div></section>
      <div class="trust-strip"><div class="trust-item">${trustIcon('M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6l-7-3Z M9 12l2 2 4-5')}<div><strong>Бережный уход</strong><span>Состав под задачу и покрытие</span></div></div><div class="trust-item">${trustIcon('M4 7h16v13H4z M8 7l1-3h6l1 3 M8 12h8')}<div><strong>Понятная запись</strong><span>Посты и время перед отправкой</span></div></div><div class="trust-item">${trustIcon('M12 3v18m7-11a7 7 0 0 0-14 0c0 4 3 7 7 7s7 3 7 7')}<div><strong>Цена согласуется</strong><span>Без неожиданной онлайн-оплаты</span></div></div></div>
      ${clientSection === 'orders' ? clientOrdersView() : `<section class="section-block" id="booking"><div class="section-heading"><div><span class="eyebrow">Подбор и запись</span><h2>Соберите свой уход</h2></div><p>Добавьте несколько работ, укажите класс авто и отправьте заявку. Коэффициент класса пересчитает цену в реальном времени.</p></div><div class="booking-layout"><div class="booking-main">
        <section class="step-panel"><div class="step-heading"><span class="step-number">1</span><div><h3>Выберите услуги</h3><p>Можно добавить несколько позиций и изменить вариант в корзине.</p></div></div><div class="service-grid">${settings.services.map((item) => serviceCard(item)).join('')}</div></section>
        <section class="step-panel"><div class="step-heading"><span class="step-number">2</span><div><h3>Готовые пакеты</h3><p>Комплексные варианты для ухода за кузовом и салоном.</p></div></div><div class="package-grid">${settings.packages.map((item) => serviceCard(item, true)).join('')}</div></section>
        <section class="step-panel"><div class="step-heading"><span class="step-number">3</span><div><h3>Класс автомобиля</h3><p>Коэффициент влияет на ориентировочную цену каждой позиции.</p></div></div><div class="class-grid">${settings.classes.map(classCard).join('')}</div></section>
        ${bookingForm()}</div>${cartMarkup()}</div></section>
        <section class="section-block" id="gallery"><div class="section-heading"><div><span class="eyebrow">Примеры работ</span><h2>До и после</h2></div><p>Демонстрационная иллюстрация с ползунком сравнения. Реальные фото студии добавляются владельцем отдельно.</p></div>${gallery}</section>`}`;
    document.querySelectorAll('[data-mode]').forEach((button) => button.classList.toggle('is-active', mode === button.dataset.mode));
  };
  const ownerLogin = () => `<section class="login-card"><span class="login-brand" aria-hidden="true">${carSvg('sedan', '')}</span><span class="eyebrow">Демо-режим владельца</span><h1>Кабинет студии</h1><p>Заявки и настройки хранятся локально в этом браузере. Здесь нет реальной авторизации или серверной защиты.</p><form id="login-form"><label class="field"><span>Пароль владельца</span><input name="password" type="password" autocomplete="current-password" required aria-describedby="login-error"></label><p id="login-error" class="login-error" aria-live="polite"></p><button class="button button-primary" type="submit">Войти в кабинет</button></form><div class="login-demo">Демо-пароль: <strong>${escapeHTML(settings.password)}</strong></div></section>`;
  const ownerTabs = [['orders', 'Заявки', '◇'], ['calendar', 'Календарь постов', '▦'], ['tariffs', 'Тарифы', '₽'], ['gallery', 'Галерея', '◫'], ['company', 'Компания', '⌂'], ['access', 'Доступ', '⌑']];
  const ownerTitle = () => ({ orders: ['Заявки', 'Новые обращения и согласование деталей'], calendar: ['Календарь постов', 'Занятость трёх постов на ближайшие дни'], tariffs: ['Тарифы', 'Редактируйте цены и множители класса автомобиля'], gallery: ['Галерея', 'Подписи, демо-сравнение и гарантийные условия'], company: ['Компания', 'Название и контакты для клиентского экрана'], access: ['Доступ', 'Демо-пароль и текущая сессия'] })[ownerSection];
  const ownerOrderCard = (order) => `<article class="owner-order-card"><div class="owner-order-head"><div><h3>${escapeHTML(order.id)} · ${escapeHTML(order.name)}</h3><p>${escapeHTML(order.phone)} · ${escapeHTML([order.make, order.model].filter(Boolean).join(' '))} · ${escapeHTML(order.vehicleClassName || '')}</p></div>${statusBadge(order.status)}</div><div class="owner-order-meta"><span>${escapeHTML((order.items || []).map((item) => `${item.name} (${item.variant})`).join(' · '))}</span><span>${escapeHTML(safeDate(order.date))} · ${escapeHTML(order.time || '')} · ${escapeHTML(order.post || '')}</span><span>Оценка: ${money(order.estimate?.min || 0)}–${money(order.estimate?.max || 0)}</span>${order.photoNames?.length ? `<span>Фото: ${order.photoNames.map(escapeHTML).join(', ')}</span>` : ''}</div><div class="owner-fields"><label class="field"><span>Статус</span><select data-order-field="status" data-order-id="${escapeHTML(order.id)}">${Object.entries(statuses).map(([id, label]) => `<option value="${id}" ${order.status === id ? 'selected' : ''}>${label}</option>`).join('')}</select></label><label class="field"><span>Итоговая цена, ₽</span><input type="number" min="0" step="100" value="${escapeHTML(order.finalPrice || '')}" placeholder="После согласования" data-order-field="finalPrice" data-order-id="${escapeHTML(order.id)}"></label><label class="field"><span>Дата</span><input type="date" value="${escapeHTML(order.date || '')}" data-order-field="date" data-order-id="${escapeHTML(order.id)}"></label><label class="field"><span>Время</span><select data-order-field="time" data-order-id="${escapeHTML(order.id)}">${['10:00', '13:00', '16:00', '18:00'].map((time) => `<option ${order.time === time ? 'selected' : ''}>${time}</option>`).join('')}</select></label><label class="field"><span>Пост</span><select data-order-field="post" data-order-id="${escapeHTML(order.id)}">${['Пост 1', 'Пост 2', 'Пост 3'].map((post) => `<option ${order.post === post ? 'selected' : ''}>${post}</option>`).join('')}</select></label><label class="field field-wide private-note-label"><span>Приватная заметка владельца</span><input value="${escapeHTML(order.privateNote || '')}" placeholder="Клиенту не показывается" data-order-field="privateNote" data-order-id="${escapeHTML(order.id)}"></label><div class="field field-wide"><span>Телефон и комментарий</span><small>${escapeHTML(order.comment || 'Комментария нет')}${order.plate ? ` · Госномер ${escapeHTML(order.plate)}` : ''}</small></div></div><div class="owner-actions"><button type="button" class="button button-secondary button-small" data-save-order="${escapeHTML(order.id)}">Сохранить согласование</button></div></article>`;
  const ownerOrders = () => {
    const query = ownerSearch.trim().toLowerCase();
    const filtered = orders.filter((order) => (ownerStatus === 'all' || order.status === ownerStatus) && (!query || [order.id, order.name, order.phone, order.make, order.model].join(' ').toLowerCase().includes(query)));
    const newCount = orders.filter((order) => order.status === 'new').length;
    return `<div class="owner-stats"><div class="stat-card"><span>Всего заявок</span><strong>${orders.length}</strong></div><div class="stat-card"><span>Новые</span><strong>${newCount}</strong></div><div class="stat-card"><span>Согласованы</span><strong>${orders.filter((order) => order.status === 'agreed').length}</strong></div></div><div class="filter-row"><label class="field"><span>Поиск по номеру, имени, телефону или авто</span><input name="ownerSearch" value="${escapeHTML(ownerSearch)}" placeholder="Начните вводить…" data-owner-search></label><label class="field"><span>Статус</span><select data-owner-status><option value="all">Все статусы</option>${Object.entries(statuses).map(([id, label]) => `<option value="${id}" ${ownerStatus === id ? 'selected' : ''}>${label}</option>`).join('')}</select></label></div>${filtered.length ? `<div class="order-list">${filtered.map(ownerOrderCard).join('')}</div>` : '<div class="empty-state"><strong>Заявок нет</strong>Новые заявки из клиентской формы появятся здесь.</div>'}<p class="demo-disclaimer">Данные этого учебного макета существуют только в текущем браузере и не передаются владельцу сайта.</p>`;
  };
  const ownerCalendar = () => {
    const days = dayOptions(); const times = ['10:00', '13:00', '16:00', '18:00'];
    return `<p class="owner-title">Для переноса используйте действие в ячейке заявки. Завершённые и отменённые записи освобождают пост.</p><div class="calendar-wrap"><table class="calendar-grid"><thead><tr><th class="time-cell">Время</th>${days.map((day) => `<th>${escapeHTML(day.label)}</th>`).join('')}</tr></thead><tbody>${times.map((time) => `<tr><th class="time-cell">${time}</th>${days.map((day) => { const bookings = busyBookings(day.date, time); return `<td>${bookings.length ? bookings.map((order) => `<div class="calendar-booking"><strong>${escapeHTML(order.name)} · ${escapeHTML(order.post || 'Пост не указан')}</strong><span>${escapeHTML(order.make)} ${escapeHTML(order.model)} · ${escapeHTML(statuses[order.status])}</span><button type="button" data-move="${escapeHTML(order.id)}">Перенести запись</button></div>`).join('') : '<span class="calendar-free">3 поста свободны</span>'}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div><p class="demo-disclaimer">Календарь показывает заявки, сохранённые только в этом браузере.</p>`;
  };
  const ownerTariffs = () => `<form class="tariff-form" id="tariff-form">${[...settings.services, ...settings.packages].map((item) => `<section class="tariff-group"><h3>${escapeHTML(item.name)}</h3>${item.variants.map((variant, index) => `<div class="tariff-row"><strong>${escapeHTML(variant.name)}</strong><label class="field"><span>От, ₽</span><input type="number" min="0" step="100" name="${item.id}.${index}.min" value="${Number(variant.min) || 0}"></label><label class="field"><span>До, ₽</span><input type="number" min="0" step="100" name="${item.id}.${index}.max" value="${Number(variant.max) || 0}"></label></div>`).join('')}</section>`).join('')}<h3>Коэффициенты класса автомобиля</h3><div class="coeff-grid">${settings.classes.map((item) => `<label class="coeff-card"><strong>${escapeHTML(item.name)}</strong><span>Множитель ×</span><input type="number" min="0.1" step="0.05" name="class.${item.id}" value="${Number(settings.multipliers[item.id]) || 1}" aria-label="Коэффициент: ${escapeHTML(item.name)}"></label>`).join('')}</div><div class="save-row"><p>Изменения сразу используются клиентским калькулятором.</p><button class="button button-primary" type="submit">Сохранить тарифы</button></div></form>`;
  const ownerGallery = () => `<form id="gallery-form"><div class="gallery-admin-list">${settings.gallery.map((item) => `<article class="gallery-admin-item"><div>${compareFrame(item.finish || 52, `admin-${item.id}`)}</div><div class="gallery-admin-fields"><label class="field"><span>Название работы</span><input name="${escapeHTML(item.id)}.title" value="${escapeHTML(item.title)}"></label><label class="field"><span>Описание</span><input name="${escapeHTML(item.id)}.text" value="${escapeHTML(item.text)}"></label><label class="field"><span>Услуга</span><input name="${escapeHTML(item.id)}.service" value="${escapeHTML(item.service || '')}"></label><label class="field"><span>Гарантия на керамику / плёнку</span><input name="${escapeHTML(item.id)}.guarantee" value="${escapeHTML(item.guarantee || '')}"></label><label class="field"><span>Позиция сравнения, %</span><input name="${escapeHTML(item.id)}.finish" type="number" min="8" max="92" value="${Number(item.finish) || 52}"></label><button type="button" class="button button-danger button-small" data-delete-gallery="${escapeHTML(item.id)}">Удалить демо-работу</button></div></article>`).join('')}</div><div class="save-row" style="margin-top:14px"><p>Только SVG-иллюстрации. Загрузка фото в этот макет не сохраняется.</p><button class="button button-secondary" type="button" data-add-gallery>Добавить демо-кейс</button><button class="button button-primary" type="submit">Сохранить галерею</button></div></form>`;
  const ownerCompany = () => `<form class="access-card" id="company-form"><h3>Данные студии</h3><p>Заполните реальные контакты при адаптации шаблона. Сейчас адрес и телефон — демонстрационные.</p><label class="field"><span>Название</span><input name="name" value="${escapeHTML(settings.company.name)}" required></label><label class="field"><span>Адрес</span><input name="address" value="${escapeHTML(settings.company.address)}" required></label><label class="field"><span>Телефон</span><input name="phone" type="tel" autocomplete="tel" value="${escapeHTML(settings.company.phone)}" required></label><label class="field"><span>Акцентный цвет</span><input name="accent" type="color" value="${escapeHTML(settings.company.accent)}"></label><button class="button button-primary" type="submit">Сохранить данные</button><span class="demo-label">Адрес и телефон помечены как демо в клиентском экране</span></form>`;
  const ownerAccess = () => `<div class="access-card"><h3>Изменить демо-пароль</h3><p>Пароль находится в localStorage и не защищает статичный сайт от доступа к данным. Не используйте реальные секреты.</p><form id="password-form"><label class="field"><span>Текущий пароль</span><input type="password" name="current" autocomplete="current-password" required></label><label class="field"><span>Новый пароль</span><input type="password" name="next" autocomplete="new-password" minlength="4" required></label><label class="field"><span>Повторите новый пароль</span><input type="password" name="repeat" autocomplete="new-password" minlength="4" required></label><p class="login-error" id="password-error" aria-live="polite"></p><button class="button button-primary" type="submit">Изменить пароль</button></form><button type="button" class="button button-secondary" style="margin-top:12px" data-logout>Выйти из кабинета</button><p class="demo-disclaimer">Демо-пароль при первой установке: <strong>${escapeHTML(settings.password)}</strong></p></div>`;
  const ownerSectionContent = () => ({ orders: ownerOrders(), calendar: ownerCalendar(), tariffs: ownerTariffs(), gallery: ownerGallery(), company: ownerCompany(), access: ownerAccess() })[ownerSection];
  const renderOwner = () => {
    if (!ownerAuthed) { app.innerHTML = ownerLogin(); return; }
    const [title, subtitle] = ownerTitle();
    app.innerHTML = `<section class="owner-shell"><nav class="owner-nav" aria-label="Разделы кабинета владельца">${ownerTabs.map(([id, label, icon]) => `<button type="button" class="${ownerSection === id ? 'is-active' : ''}" data-owner-tab="${id}" aria-current="${ownerSection === id ? 'page' : 'false'}"><span aria-hidden="true">${icon}</span>${label}</button>`).join('')}</nav><div class="owner-body"><header class="owner-title"><span class="eyebrow">Панель владельца · локально</span><h1>${escapeHTML(title)}</h1><p>${escapeHTML(subtitle)}</p></header>${ownerSectionContent()}</div></section>`;
  };
  const render = () => {
    document.querySelectorAll('[data-mode]').forEach((button) => button.classList.toggle('is-active', mode === button.dataset.mode));
    if (mode === 'owner') renderOwner(); else renderClient();
  };
  const findOrder = (id) => orders.find((order) => order.id === id);
  const addToCart = (itemId, variantName) => {
    const item = itemById(itemId); if (!item) return;
    cart.push({ itemId, variant: variantName || item.variants[0].name });
    save(KEYS.cart, cart); render(); showToast(`${item.name} добавлена в заказ.`);
  };
  const captureOrderField = (control) => {
    const order = findOrder(control.dataset.orderId); if (!order) return;
    const value = control.value;
    if (control.dataset.orderField === 'finalPrice') order.finalPrice = Number(value) || 0;
    else order[control.dataset.orderField] = value;
    save(KEYS.orders, orders);
  };
  const openMoveDialog = (orderId) => {
    const order = findOrder(orderId); if (!order || !moveDialog) return;
    moveForm.elements.orderId.value = order.id;
    moveForm.elements.date.value = order.date || dateISO(1);
    moveForm.elements.time.value = order.time || '10:00';
    moveForm.elements.post.value = order.post || 'Пост 1';
    moveDialog.showModal();
  };

  document.addEventListener('click', (event) => {
    const target = event.target.closest('button, [data-compare-frame]'); if (!target) return;
    if (target.matches('[data-mode]')) {
      mode = target.dataset.mode; if (mode === 'client') clientSection = 'booking'; render(); window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (target.matches('[data-theme-toggle]')) {
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = next; save(KEYS.theme, next); document.querySelector('meta[name="theme-color"]').content = next === 'dark' ? '#171c19' : '#f1f3ed';
    } else if (target.matches('[data-client-tab]')) {
      mode = 'client'; clientSection = target.dataset.clientTab; render(); document.querySelector('#main').focus({ preventScroll: true });
    } else if (target.matches('[data-add]')) {
      const item = itemById(target.dataset.add); const select = document.querySelector(`[data-variant-select="${CSS.escape(target.dataset.add)}"]`); addToCart(target.dataset.add, select?.value || item?.variants[0].name);
    } else if (target.matches('[data-remove]')) {
      cart.splice(Number(target.dataset.remove), 1); save(KEYS.cart, cart); render(); showToast('Позиция удалена.');
    } else if (target.matches('[data-class]')) {
      selectedClass = target.dataset.class; saveDraft(); render();
    } else if (target.matches('[data-time]')) {
      draft.time = target.dataset.time;
      const posts = availablePosts(draft.date, draft.time);
      draft.post = posts[0] || '';
      saveDraft(); render();
    } else if (target.matches('[data-scroll-booking]')) {
      document.querySelector('#booking-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); document.querySelector('#booking-form input[name="name"]')?.focus({ preventScroll: true });
    } else if (target.matches('[data-owner-tab]')) {
      ownerSection = target.dataset.ownerTab; render();
    } else if (target.matches('[data-save-order]')) {
      const order = findOrder(target.dataset.saveOrder); if (order?.status === 'new') order.status = 'agreed'; save(KEYS.orders, orders); render(); showToast('Изменения сохранены. Клиент увидит новый статус.');
    } else if (target.matches('[data-move]')) openMoveDialog(target.dataset.move);
    else if (target.matches('[data-close-dialog]')) moveDialog.close();
    else if (target.matches('[data-logout]')) { ownerAuthed = false; render(); }
    else if (target.matches('[data-delete-gallery]')) {
      if (confirm('Удалить эту демо-работу из галереи?')) { settings.gallery = settings.gallery.filter((work) => work.id !== target.dataset.deleteGallery); save(KEYS.settings, settings); render(); }
    } else if (target.matches('[data-add-gallery]')) {
      settings.gallery.push({ id: `work-${Date.now()}`, title: 'Новая демо-работа', text: 'Схематичная иллюстрация для адаптации шаблона.', service: 'Детейлинг', guarantee: 'Условия гарантии уточняются с мастером', finish: 52 }); save(KEYS.settings, settings); render();
    }
  });

  document.addEventListener('input', (event) => {
    const control = event.target;
    if (control.matches('[data-draft]')) {
      if (control.name === 'consent') draft.consent = control.checked; else if (control.name === 'date') { draft.date = control.value; draft.time = ''; draft.post = ''; render(); }
      else draft[control.name] = control.value;
      saveDraft();
    } else if (control.matches('[data-owner-search]')) {
      ownerSearch = control.value; const selectionStart = control.selectionStart; render(); const next = document.querySelector('[data-owner-search]'); next?.focus(); next?.setSelectionRange(selectionStart, selectionStart);
    } else if (control.matches('[data-order-field]')) captureOrderField(control);
    else if (control.matches('[data-compare]')) {
      const frame = document.querySelector(`[data-compare-frame="${CSS.escape(control.dataset.compare)}"]`); frame?.style.setProperty('--compare', `${control.value}%`); compareValue = Number(control.value);
    } else if (control.matches('[data-photos]')) {
      const files = Array.from(control.files || []).slice(0, 3);
      if ((control.files || []).length > 3) showToast('Можно приложить не более 3 фотографий.');
      photoPreviews = []; draft.photoNames = files.map((file) => file.name); saveDraft(); render();
      files.forEach((file) => { const reader = new FileReader(); reader.addEventListener('load', () => { photoPreviews.push({ name: file.name, data: reader.result }); render(); }); reader.readAsDataURL(file); });
    }
  });
  document.addEventListener('change', (event) => {
    const control = event.target;
    if (control.matches('[data-cart-variant]')) { const entry = cart[Number(control.dataset.cartVariant)]; if (entry) entry.variant = control.value; save(KEYS.cart, cart); render(); }
    else if (control.matches('[data-owner-status]')) { ownerStatus = control.value; render(); }
    else if (control.matches('[data-order-field]')) captureOrderField(control);
    else if (control.matches('[data-draft]')) { if (control.name === 'date') { draft.date = control.value; draft.time = ''; draft.post = ''; saveDraft(); render(); } else if (control.name === 'post') { draft.post = control.value; saveDraft(); } }
  });

  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (form.id === 'booking-form') {
      event.preventDefault(); const error = document.querySelector('#form-error');
      if (!cart.length) { error.textContent = 'Добавьте услугу или пакет, чтобы отправить заявку.'; return; }
      if (!form.reportValidity()) { error.textContent = 'Заполните обязательные поля и подтвердите согласие.'; form.querySelector(':invalid')?.focus(); return; }
      if (!draft.time || !draft.post) { error.textContent = 'Выберите свободное время и пост.'; form.querySelector('[data-time]')?.focus(); return; }
      if (!availablePosts(draft.date, draft.time).includes(draft.post)) { error.textContent = 'Этот пост уже занят. Выберите другое свободное место.'; form.querySelector('[name="date"]')?.focus(); return; }
      const range = cartRange(); const now = new Date(); const shortDate = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      const id = `GD-${shortDate}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
      const order = { id, name: draft.name.trim(), phone: draft.phone.trim(), make: draft.make.trim(), model: draft.model.trim(), plate: draft.plate.trim(), vehicleClass: selectedClass, vehicleClassName: currentClass().name, date: draft.date, time: draft.time, post: draft.post, comment: draft.comment.trim(), photoNames: [...draft.photoNames], items: cart.map((entry) => { const item = itemById(entry.itemId); return { id: item.id, name: item.name, variant: entry.variant }; }), estimate: range, hasPhotoQuote: hasPhotoQuote(), finalPrice: 0, status: 'new', privateNote: '', createdLabel: new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short' }).format(now) };
      orders.unshift(order); save(KEYS.orders, orders); latestOrderId = id; cart = []; save(KEYS.cart, cart); draft = { name: '', phone: order.phone, make: '', model: '', plate: '', date: '', time: '', post: '', comment: '', consent: false, photoNames: [], vehicleClass: selectedClass }; photoPreviews = []; saveDraft(); customerLookup = order.phone; clientSection = 'orders'; render(); window.scrollTo({ top: document.querySelector('#main').offsetTop, behavior: 'smooth' });
      app.insertAdjacentHTML('afterbegin', `<div class="success-banner"><span class="success-mark" aria-hidden="true">✓</span><div><h3>Заявка отправлена · ${escapeHTML(id)}</h3><p>Статус: <strong>на согласовании</strong>. Это локальный учебный макет: заявка сохранена в браузере, мастер не получит уведомление.</p></div></div>`); showToast('Заявка сохранена в этом браузере.');
    } else if (form.id === 'lookup-form') { event.preventDefault(); customerLookup = form.elements.lookup.value; render(); }
    else if (form.id === 'login-form') { event.preventDefault(); const error = document.querySelector('#login-error'); if (form.elements.password.value === settings.password) { ownerAuthed = true; ownerSection = 'orders'; render(); } else error.textContent = 'Пароль не подошёл. Сверьте демо-пароль на этой странице.'; }
    else if (form.id === 'tariff-form') {
      event.preventDefault(); const data = new FormData(form);
      [...settings.services, ...settings.packages].forEach((item) => item.variants.forEach((variant, index) => { variant.min = Math.max(0, Number(data.get(`${item.id}.${index}.min`)) || 0); variant.max = Math.max(variant.min, Number(data.get(`${item.id}.${index}.max`)) || 0); }));
      settings.classes.forEach((item) => { settings.multipliers[item.id] = Math.max(.1, Number(data.get(`class.${item.id}`)) || 1); item.factor = `×${String(settings.multipliers[item.id]).replace('.', ',')}`; }); save(KEYS.settings, settings); render(); showToast('Тарифы и коэффициенты сохранены.');
    } else if (form.id === 'company-form') {
      event.preventDefault(); const data = new FormData(form); settings.company = Object.fromEntries(['name', 'address', 'phone', 'accent'].map((key) => [key, String(data.get(key) || '').trim()])); document.documentElement.style.setProperty('--accent', settings.company.accent); save(KEYS.settings, settings); render(); showToast('Данные студии сохранены.');
    } else if (form.id === 'gallery-form') {
      event.preventDefault(); const data = new FormData(form); settings.gallery.forEach((work) => { for (const key of ['title', 'text', 'service', 'guarantee']) work[key] = String(data.get(`${work.id}.${key}`) || '').trim(); work.finish = Math.min(92, Math.max(8, Number(data.get(`${work.id}.finish`)) || 52)); }); save(KEYS.settings, settings); render(); showToast('Галерея сохранена.');
    } else if (form.id === 'password-form') {
      event.preventDefault(); const data = new FormData(form); const error = document.querySelector('#password-error');
      if (data.get('current') !== settings.password) error.textContent = 'Текущий пароль указан неверно.';
      else if (data.get('next') !== data.get('repeat')) error.textContent = 'Новые пароли не совпадают.';
      else { settings.password = String(data.get('next')); save(KEYS.settings, settings); render(); showToast('Пароль изменён в localStorage.'); }
    }
  });

  document.addEventListener('change', (event) => {
    if (event.target.matches('[data-order-field]')) { captureOrderField(event.target); render(); }
  });
  moveForm.addEventListener('submit', (event) => {
    event.preventDefault(); const data = new FormData(moveForm); const order = findOrder(String(data.get('orderId'))); if (!order) return;
    const date = String(data.get('date')); const time = String(data.get('time')); const post = String(data.get('post'));
    const collision = orders.some((item) => item.id !== order.id && item.date === date && item.time === time && item.post === post && !['cancelled', 'completed'].includes(item.status));
    if (collision) { showToast('Этот пост в это время уже занят. Выберите другой слот.'); return; }
    order.date = date; order.time = time; order.post = post; save(KEYS.orders, orders); moveDialog.close(); render(); showToast('Время и пост заявки перенесены.');
  });
  moveDialog.addEventListener('click', (event) => { if (event.target === moveDialog) moveDialog.close(); });

  const savedTheme = read(KEYS.theme, 'dark'); document.documentElement.dataset.theme = savedTheme === 'light' ? 'light' : 'dark';
  if (settings.company.accent) document.documentElement.style.setProperty('--accent', settings.company.accent);
  render();

  window.addEventListener('beforeinstallprompt', (event) => { event.preventDefault(); deferredInstallPrompt = event; const installButton = document.querySelector('[data-install]'); if (installButton) installButton.hidden = false; });
  document.querySelector('[data-install]')?.addEventListener('click', async () => { if (!deferredInstallPrompt) return; await deferredInstallPrompt.prompt(); deferredInstallPrompt = null; });
  if ('serviceWorker' in navigator && location.protocol !== 'file:') window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => showToast('Офлайн-режим пока недоступен в этом браузере.')));
})();
