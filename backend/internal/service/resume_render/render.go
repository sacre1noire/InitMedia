package resume_render

import (
	"bytes"
	"html/template"

	"backend/internal/domain/resume"
)

const classicBWTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Resume Preview</title>
<style>
  :root {
    --text: #111111;
    --muted: #4b5563;
    --line: #e5e7eb;
  }
  body {
    font-family: "Helvetica Neue", Arial, sans-serif;
    color: var(--text);
    margin: 0;
    padding: 32px;
    background: #ffffff;
  }
  .page {
    max-width: 820px;
    margin: 0 auto;
  }
  header {
    border-bottom: 2px solid var(--line);
    padding-bottom: 16px;
    margin-bottom: 20px;
  }
  h1 {
    font-size: 28px;
    margin: 0 0 6px 0;
  }
  .subtitle {
    font-size: 16px;
    color: var(--muted);
  }
  .contacts {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 12px;
    font-size: 13px;
    color: var(--muted);
  }
  section {
    margin-bottom: 18px;
  }
  h2 {
    font-size: 16px;
    margin: 0 0 8px 0;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .item {
    margin-bottom: 10px;
  }
  .item-title {
    font-weight: 600;
  }
  .item-meta {
    font-size: 12px;
    color: var(--muted);
  }
  ul {
    padding-left: 18px;
    margin: 6px 0 0 0;
  }
  .skills {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .skill {
    border: 1px solid var(--line);
    padding: 4px 8px;
    border-radius: 999px;
    font-size: 12px;
  }
</style>
</head>
<body>
  <div class="page">
    <header>
      <h1>{{.FullName}}</h1>
      <div class="subtitle">{{.Qualification}}</div>
      <div class="contacts">
        {{if .Contacts.Email}}<span>Email: {{.Contacts.Email}}</span>{{end}}
        {{if .Contacts.Phone}}<span>Phone: {{.Contacts.Phone}}</span>{{end}}
        {{if .Contacts.Telegram}}<span>Telegram: {{.Contacts.Telegram}}</span>{{end}}
        {{if .Contacts.PortfolioURL}}<span>Portfolio: {{.Contacts.PortfolioURL}}</span>{{end}}
      </div>
    </header>

    {{if .Goals}}
    <section>
      <h2>Professional goals</h2>
      <p>{{.Goals}}</p>
    </section>
    {{end}}

    {{if .Experience}}
    <section>
      <h2>Experience</h2>
      {{range .Experience}}
      <div class="item">
        <div class="item-title">{{.Role}} — {{.Company}}</div>
        <div class="item-meta">{{.StartDate}}{{if .EndDate}} – {{.EndDate}}{{end}}</div>
        {{if .Description}}<p>{{.Description}}</p>{{end}}
      </div>
      {{end}}
    </section>
    {{end}}

    {{if .Education}}
    <section>
      <h2>Education</h2>
      {{range .Education}}
      <div class="item">
        <div class="item-title">{{.Institution}}</div>
        <div class="item-meta">{{.Degree}}{{if .StartYear}} • {{.StartYear}}{{end}}{{if .EndYear}} – {{.EndYear}}{{end}}</div>
        {{if .Description}}<p>{{.Description}}</p>{{end}}
      </div>
      {{end}}
    </section>
    {{end}}

    {{if .Recommendations}}
    <section>
      <h2>Recommendations</h2>
      {{range .Recommendations}}
      <div class="item">
        <div class="item-title">{{.Name}}{{if .Position}} — {{.Position}}{{end}}</div>
        {{if .Contact}}<div class="item-meta">{{.Contact}}</div>{{end}}
        {{if .Text}}<p>{{.Text}}</p>{{end}}
      </div>
      {{end}}
    </section>
    {{end}}

    {{if .Skills}}
    <section>
      <h2>Skills</h2>
      <div class="skills">
        {{range .Skills}}
        <span class="skill">{{.}}</span>
        {{end}}
      </div>
    </section>
    {{end}}
  </div>
</body>
</html>
`

var classicBW = template.Must(template.New("classic-bw").Parse(classicBWTemplate))

func RenderClassicBW(content resume.ResumeContent) string {
	var buf bytes.Buffer
	_ = classicBW.Execute(&buf, content)
	return buf.String()
}
