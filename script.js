let students = []
let degrees = []
let classes = []
let matters = []
let relations = []
let teachers = []

async function fetchData() {
    students  = await fetch('./students.json').then(r => r.json())
    degrees   = await fetch('./degrees.json').then(r => r.json())
    classes   = (await fetch('./classes.json').then(r => r.json())).classes
    matters   = await fetch('./matters.json').then(r => r.json())
    relations = await fetch('./relationships.json').then(r => r.json())
    teachers  = await fetch('./teachers.json').then(r => r.json())

    loadFilter()
    loadFormSelects()
    renderStudents()
    renderChart()
    renderTeachers()
}

const degreesName = id => degrees.find(d => d.id === id)?.name || "-"
const mattersName = id => matters.find(m => m.id === id)?.name || "-"
const classesName = id => classes[id - 1]?.name || classes[id - 1] || "-"

function loadFilter(){  
    const degreeSelect = document.getElementById('degreeFilter')
    const classSelect = document.getElementById('classFilter')
    const teacherDegreeSelect = document.getElementById('teacherDegreeFilter')    
    const teacherClassSelect = document.getElementById('teacherClassFilter')

    degreeSelect.innerHTML = '<option value="">Todos</option>'
    classSelect.innerHTML = '<option value="">Todas</option>'
    teacherDegreeSelect.innerHTML = '<option value="">Todos</option>'
    teacherClassSelect.innerHTML = '<option value="">Todas</option>'

    degrees.forEach(d => {
        degreeSelect.innerHTML += `<option value="${d.id}">${d.name}</option>`
        teacherDegreeSelect.innerHTML += `<option value="${d.id}">${d.name}</option>`
    })

    classes.forEach((c,i)=> {
        const name = c.name || c
        classSelect.innerHTML += `<option value="${i+1}">${name}</option>`
        teacherClassSelect.innerHTML += `<option value="${i+1}">${name}</option>`
    })

    degreeSelect.onchange = renderStudents
    classSelect.onchange = renderStudents
    teacherDegreeSelect.onchange = renderTeachers
    teacherClassSelect.onchange = renderTeachers
}

function renderStudents() {
    const tableBody = document.querySelector("#studentsTable tbody")
    const degreeFilter = document.getElementById('degreeFilter').value
    const classFilter = document.getElementById('classFilter').value

    tableBody.innerHTML = '' 

    students
        .filter(s => (!degreeFilter || s.degreeId == degreeFilter) && (!classFilter || s.classId == classFilter))
        .forEach(student => {
        const tr = document.createElement("tr")
        tr.innerHTML = `
            <td>${student.ra}</td>
            <td><input value="${student.name}" data-id="${student.id}" /></td>
            <td>${degreesName(student.degreeId)}</td>
            <td>
                <select data-id="${student.id}">
                    ${classes.map((c,i)=>{
                        const name = c.name || c
                        return `<option value="${i+1}" ${student.classId==i+1?'selected':''}>${name}</option>`
                    }).join("")}
                </select>
            </td>
        `
        tableBody.appendChild(tr)
    })

    document.querySelectorAll('#studentsTable input').forEach(input => {
        input.oninput = e => {
            const id = +e.target.dataset.id
            const student = students.find(s => s.id === id)
            if (student){ student.name = e.target.value; renderTeachers() }
        }
    })

    document.querySelectorAll('#studentsTable select').forEach(select => {
        select.onchange = e => {
            const id = +e.target.dataset.id
            const student = students.find(s => s.id === id)
            if (student){ student.classId = +e.target.value; renderTeachers() }
        }
    })
}

function generateStudents() {
    const startId = students.length
    for (let i = 0; i < 300; i++) {
        students.push({
            id: startId + i + 1,
            ra: Math.floor(100000 + Math.random()*900000),
            name: `Aluno ${startId + i + 1}`,
            degreeId: degrees[Math.floor(Math.random()*degrees.length)].id,
            classId: Math.floor(Math.random()*classes.length)+1
        })
    }
    renderTeachers()
    renderStudents()
    renderChart()
}

let chart = null

function renderChart() {    
    const ctx = document.getElementById('studentsChart').getContext('2d')
    const values = degrees.map(degree => students.filter(s => s.degreeId === degree.id).length)
    
    if (chart) chart.destroy()

    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: degrees.map(d => d.name),
            datasets: [{ data: values }]
        }
    })
}

function renderTeachers() {
    const box = document.getElementById('teachersBox')
    const degreeFilter = document.getElementById('teacherDegreeFilter').value
    const classFilter  = document.getElementById('teacherClassFilter').value

    box.innerHTML = ''

    relations.forEach(rel => {
        const teacher = teachers.find(t => t.id === rel.teacherId)
        const matter  = matters.find(m => m.id === rel.matterId)

        let html = `
            <div style="background:#1e293b;padding:20px;margin-bottom:20px;border-radius:12px;border:1px solid #334155;color:white;box-shadow:0 0 5px #0004;">
                <h2 style="margin-bottom:5px;">${teacher?.name}</h2>
                <p style="font-size:15px;margin-bottom:15px;opacity:.8;">Matéria: <b>${matter?.name}</b></p>
                <table style="width:100%;border-collapse:collapse;">
                    <thead>
                        <tr style="background:#0f172a;">
                            <th style="padding:8px;border-bottom:1px solid #334155;text-align:left;">Degree</th>
                            <th style="padding:8px;border-bottom:1px solid #334155;text-align:left;">Classes</th>
                            <th style="padding:8px;border-bottom:1px solid #334155;text-align:left;">Ação</th>
                        </tr>
                    </thead>
                    <tbody>
        `

        rel.degrees.forEach(d => {
            if (degreeFilter && d.degreeId != degreeFilter) return

            const validClasses = d.classes.filter(cls => {
                const cid = cls.classId || cls.classPosition
                return !classFilter || cid == classFilter
            })

            let classList = validClasses
                .map(cls => classesName(cls.classId || cls.classPosition))
                .join(', ') || "(nenhuma classe válida)"

            const idArray = validClasses.map(c => c.classId || c.classPosition)

            html += `
                <tr>
                    <td style="padding:8px;">${degreesName(d.degreeId)}</td>
                    <td style="padding:8px;">${classList}</td>
                    <td style="padding:8px;">
                        <button onclick='showStudentsByDegree(${d.degreeId}, [${idArray.join(",")}])'
                            style="padding:6px 10px;border-radius:5px;border:0;background:#3b82f6;color:white;cursor:pointer;">
                            Ver alunos
                        </button>
                    </td>
                </tr>
            `
        })

        html += `</tbody></table></div>`
        box.innerHTML += html
    })
}

function showStudentsByDegree(degreeId) {
    const list = students.filter(s => s.degreeId == degreeId)

    if (list.length === 0) {
        alert(`Nenhum aluno encontrado para ${degreesName(degreeId)}.`)
        return
    }

    alert(
        `Alunos de ${degreesName(degreeId)}:\n\n` +
        list.map(s => `${s.name} (Classe ${classesName(s.classId)})`).join("\n")
    )
}

function loadFormSelects() {
    const teacher = document.getElementById('teacherSelect')
    const matter  = document.getElementById('matterSelect')
    const degree  = document.getElementById('degreeSelect')
    const classe  = document.getElementById('classSelect')

    teachers.forEach(t => teacher.innerHTML += `<option value="${t.id}">${t.name}</option>`)
    matters.forEach(m => matter.innerHTML  += `<option value="${m.id}">${m.name}</option>`)
    degrees.forEach(d => degree.innerHTML  += `<option value="${d.id}">${d.name}</option>`)
    classes.forEach((c,i) => classe.innerHTML += `<option value="${i+1}">${c.name || c}</option>`)

    document.getElementById('relationshipForm').onsubmit = e => {
        e.preventDefault()

        const novaRelation = {
            id: relations.length + 1,
            teacherId: Number(teacher.value),
            matterId: Number(matter.value),
            degrees: [{
                degreeId: Number(degree.value),
                classes: [{ classId: Number(classe.value) }]
            }]
        }

        const exists = relations.some(r =>
            r.teacherId === novaRelation.teacherId &&
            r.matterId === novaRelation.matterId &&
            r.degrees.some(d =>
                d.degreeId === novaRelation.degrees[0].degreeId &&
                d.classes.some(c => c.classId === novaRelation.degrees[0].classes[0].classId)
            )
        )
        if (exists) {
            showFormMessage('Este relacionamento já existe.', 'error')
            return
        }

        relations.push(novaRelation)

        e.target.reset()
        showFormMessage('Relacionamento criado com sucesso!', 'success')
        renderTeachers()
    }
}

function showFormMessage(text, type) {
    const container = document.querySelector('#relationshipForm').parentElement
    const msg = document.createElement('div')
    msg.textContent = text
    msg.style.color = type === 'success' ? '#22c55e' : '#ff4d4f'
    msg.style.marginTop = '8px'
    container.appendChild(msg)
    setTimeout(() => msg.remove(), 3000)
}

fetchData()

