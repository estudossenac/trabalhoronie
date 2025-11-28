const STORAGE_KEY = 'goldenhost_prototype_v1';


const sampleListings = [
  {id:1,title:'Apartamento aconchegante em Sapporo',type:'Apartamento',city:'Sapporo',price:8500,image:'',desc:'1 quarto, perto do metrô',status:'available'},
  {id:2,title:'Casa com vista para o mar',type:'Casa',city:'Okinawa',price:12500,image:'',desc:'2 quartos, piscina',status:'booked'},
  {id:3,title:'Quarto solo em Tóquio',type:'Quarto',city:'Tokyo',price:4200,image:'',desc:'Ótimo para viajantes solo',status:'available'}
];

let state = {
  listings: [],
  selectedListing: null,
  tasks: { todo: 2, doing: 1, done: 0 }
};


function $(s){ return document.querySelector(s); }
function $all(s){ return [...document.querySelectorAll(s)]; }


function load(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(raw){
    state = JSON.parse(raw);
  } else {
    state.listings = sampleListings;
    save();
  }
  renderAll();
}

function save(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}


function renderAll(){
  renderCounts();
  renderListings(state.listings);
}


function renderCounts(){
  $('#totalCount').textContent = state.listings.length;

  const booked = state.listings.filter(l=>l.status==='booked').length;
  $('#occupancy').textContent = Math.round((booked/state.listings.length||0)*100)+'%';

  const revenue = state.listings.reduce((sum,l)=> 
    sum + (l.status==='booked' ? l.price*1 : 0), 0);
  $('#revenue').textContent = revenue.toLocaleString('pt-BR', { style:'currency', currency:'BRL' });


  $('#todoCount').textContent = state.tasks.todo;
  $('#doingCount').textContent = state.tasks.doing;
  $('#doneCount').textContent = state.tasks.done;
}


function renderListings(list){
  const c = $('#listingsSection');
  c.innerHTML = '';

  if(list.length === 0){
    c.innerHTML = '<div style="padding:20px;color:var(--muted)">Nenhuma propriedade encontrada.</div>';
    return;
  }

  list.forEach(l=>{
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `
      <img src="${l.image}" onerror="this.src='https://via.placeholder.com/600x400?text=Imagem+Indisponível'">
      
      <div class="meta">
        <div>
          <span class="title">${l.title}</span>
         <span class="price">${l.price.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</span>

        </div>

        <div style="margin-top:8px;font-size:13px">
          ${l.city} • ${l.type} • <b>${l.status === "booked" ? "reservado" : "disponível"}</b>

        </div>

        <div style="margin-top:10px;display:flex;gap:8px">
          <button data-id="${l.id}" class="viewBtn">Ver</button>
          <button data-id="${l.id}" class="editBtn">Editar</button>
          <button data-id="${l.id}" class="bookBtn">Reservar</button>
          <button data-id="${l.id}" class="delBtn">Excluir</button>
        </div>
      </div>
    `;
    c.appendChild(div);
  });


  $all('.viewBtn').forEach(b=> b.onclick = e=> viewListing(+e.target.dataset.id));
  $all('.editBtn').forEach(b=> b.onclick = e=> openEdit(+e.target.dataset.id));
  $all('.delBtn').forEach(b=> b.onclick = e=> deleteListing(+e.target.dataset.id));
  $all('.bookBtn').forEach(b=> b.onclick = e=> openBooking(+e.target.dataset.id));
}


function openNew(){
  $('#modalTitle').textContent='Nova Propriedade';
  $('#fTitle').value='';
  $('#fType').value='Casa';
  $('#fCity').value='';
  $('#fPrice').value='';
  $('#fImage').value='';
  $('#fDesc').value='';
  $('#overlay').classList.add('show');
  state.selectedListing=null;
}


function openEdit(id){
  const l = state.listings.find(x=>x.id===id);
  if(!l) return;

  $('#modalTitle').textContent='Editar Propriedade';
  $('#fTitle').value=l.title;
  $('#fType').value=l.type;
  $('#fCity').value=l.city;
  $('#fPrice').value=l.price;
  $('#fImage').value=l.image;
  $('#fDesc').value=l.desc;

  $('#overlay').classList.add('show');
  state.selectedListing=id;
}

function saveFromModal(){
  const title = $('#fTitle').value.trim();
  if(!title){ alert('Título necessário'); return; }

  const payload = {
    title,
    type: $('#fType').value,
    city: $('#fCity').value,
    price: Number($('#fPrice').value)||0,
    image: $('#fImage').value || 'https://plus.unsplash.com/premium_photo-1744532827466-67bce8833c63?q=80&w=2064&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    desc: $('#fDesc').value,
    status: 'available'
  };

  if(state.selectedListing){
    const index = state.listings.findIndex(x=>x.id===state.selectedListing);
    state.listings[index] = {...state.listings[index], ...payload};
  } else {
    payload.id = Date.now();
    state.listings.push(payload);
  }

  save();
  renderAll();
  $('#overlay').classList.remove('show');
}


function deleteListing(id){
  if(!confirm('Excluir propriedade?')) return;
  state.listings = state.listings.filter(x=>x.id!==id);
  save();
  renderAll();
}

function viewListing(id){
  const l = state.listings.find(x=>x.id===id);
  alert(`${l.title}\n\n${l.desc}\n\nCidade: ${l.city} • Tipo: ${l.type} • Preço: ${l.price.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}`);

}

function openBooking(id){
  state.selectedListing=id;
  $('#overlayBooking').classList.add('show');
}

function confirmBooking(){
  const inDate = $('#checkin').value;
  const outDate = $('#checkout').value;
  const guest = $('#guestName').value.trim() || 'Hóspede';

  if(!inDate || !outDate){
    alert('Escolha check-in e check-out');
    return;
  }

  const l = state.listings.find(x=>x.id===state.selectedListing);
  if(l) {
    l.status = 'booked';
    l.guest = guest;
    l.checkin = inDate;
    l.checkout = outDate;
  }

  save();
  renderAll();
  $('#overlayBooking').classList.remove('show');

  alert('Reserva confirmada para '+guest);
}


function applyFilters(){
  const city = $('#filterCity').value.toLowerCase();
  const type = $('#filterType').value;
  const price = Number($('#filterPrice').value) || Infinity;

  const list = state.listings.filter(l=>
    (!city || l.city.toLowerCase().includes(city)) &&
    (!type || l.type === type) &&
    l.price <= price
  );
  renderListings(list);
}

function clearFilters(){
  $('#filterCity').value='';
  $('#filterType').value='';
  $('#filterPrice').value='';
  renderAll();
}

document.addEventListener('DOMContentLoaded', ()=>{
  load();

  $('#addListingBtn').onclick = openNew;
  $('#closeModal').onclick = ()=> $('#overlay').classList.remove('show');
  $('#saveListing').onclick = saveFromModal;

  $('#closeBooking').onclick = ()=> $('#overlayBooking').classList.remove('show');
  $('#confirmBooking').onclick = confirmBooking;

  $('#applyFilters').onclick = applyFilters;
  $('#clearFilters').onclick = clearFilters;

  $('#searchInput').oninput = e=>{
    const q = e.target.value.toLowerCase();
    if(!q) return renderAll();

    renderListings(
      state.listings.filter(l=> 
        l.title.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q)
      )
    );
  };

  document.addEventListener('keydown', e=>{
    if(e.key==='Escape'){
      $('#overlay').classList.remove('show');
      $('#overlayBooking').classList.remove('show');
    }
  });
});

function showAll(){
  renderListings(state.listings);
}

function showAvailable(){
  const list = state.listings.filter(l => l.status === "available");
  renderListings(list);
}

function showBooked(){
  const list = state.listings.filter(l => l.status === "booked");
  renderListings(list);
}

document.querySelector(".header-buttons button:nth-child(1)").onclick = () => {
  setActiveHeaderButton(1);
  showAll();
};

document.querySelector(".header-buttons button:nth-child(2)").onclick = () => {
  setActiveHeaderButton(2);
  showAvailable();
};

document.querySelector(".header-buttons button:nth-child(3)").onclick = () => {
  setActiveHeaderButton(3);
  showBooked();
};

function setActiveHeaderButton(index){
  const btns = document.querySelectorAll(".header-buttons button");
  btns.forEach(b => b.classList.remove("active"));
  btns[index - 1].classList.add("active");
}


function confirmBooking(){
  const inDate = $('#checkin').value;
  const outDate = $('#checkout').value;
  const guest = $('#guestName').value.trim() || 'Hóspede';

  if(!inDate || !outDate){
    alert('Escolha check-in e check-out');
    return;
  }

  const l = state.listings.find(x=>x.id===state.selectedListing);
  if(l) {
    l.status = 'booked';
    l.guest = guest;       
    l.checkin = inDate;    
    l.checkout = outDate;  
  }

  save();
  renderAll();
  $('#overlayBooking').classList.remove('show');

  alert('Reserva confirmada para '+guest);
}

function viewListing(id){
  const l = state.listings.find(x=>x.id===id);

  const guestInfo =
    l.status === 'booked'
    ? `\nReservado para: ${l.guest}\nCheck-in: ${l.checkin}\nCheck-out: ${l.checkout}`
    : '\nNão reservado';

  alert(
    `${l.title}\n\n${l.desc}\n\nCidade: ${l.city} • Tipo: ${l.type} • Preço: ${
      l.price.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
    }\n${guestInfo}`
  );
}

