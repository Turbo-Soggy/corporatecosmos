function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function slug(value) {
  return String(value || 'targeted_cv').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'targeted_cv';
}

function lines(draft) {
  const out = [];
  out.push(draft.name || 'Candidate');
  if (draft.email) out.push(draft.email);
  out.push('');
  out.push(`${draft.target_role || 'Target role'}${draft.target_company ? ` | ${draft.target_company}` : ''}`);
  out.push('');
  if (draft.summary) out.push(`SUMMARY\n${draft.summary}\n`);
  if (draft.skills?.length) out.push(`SKILLS\n${draft.skills.map((skill) => skill.name).join(' · ')}\n`);
  if (draft.experience?.length) {
    out.push('EXPERIENCE');
    draft.experience.forEach((item) => {
      out.push(`${[item.role, item.organization, item.dates].filter(Boolean).join(' | ')}`);
      item.bullets.forEach((bullet) => out.push(`- ${bullet}`));
    });
    out.push('');
  }
  if (draft.projects?.length) {
    out.push('PROJECTS');
    draft.projects.forEach((item) => { out.push(item.name); item.bullets.forEach((bullet) => out.push(`- ${bullet}`)); });
    out.push('');
  }
  if (draft.education?.length) out.push(`EDUCATION\n${draft.education.map((item) => [item.qualification, item.institution, item.dates].filter(Boolean).join(' | ')).join('\n')}\n`);
  if (draft.certifications?.length) out.push(`CERTIFICATIONS\n${draft.certifications.join('\n')}\n`);
  if (draft.hackathons?.length) out.push(`HACKATHONS\n${draft.hackathons.join('\n')}\n`);
  return out.join('\n');
}

export function downloadTargetedCv(draft, format = 'doc') {
  const plain = lines(draft);
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(draft.target_role || 'Targeted CV')}</title><style>body{font-family:Arial,sans-serif;color:#172033;max-width:760px;margin:40px auto;line-height:1.45}h1{margin-bottom:4px}h2{font-size:12px;letter-spacing:2px;border-bottom:1px solid #ccd3df;padding-bottom:4px;margin-top:24px}h3{margin-bottom:0}p{margin-top:4px}.meta{color:#58657a}.item{margin:12px 0}.item p{margin:2px 0}</style></head><body><h1>${escapeHtml(draft.name || 'Candidate')}</h1><div class="meta">${escapeHtml(draft.email)}${draft.target_company ? ` · ${escapeHtml(draft.target_company)}` : ''}</div><h2>SUMMARY</h2><p>${escapeHtml(draft.summary)}</p>${draft.skills?.length ? `<h2>SKILLS</h2><p>${draft.skills.map((skill) => escapeHtml(skill.name)).join(' · ')}</p>` : ''}${draft.experience?.length ? `<h2>EXPERIENCE</h2>${draft.experience.map((item) => `<div class="item"><strong>${escapeHtml([item.role, item.organization, item.dates].filter(Boolean).join(' | '))}</strong>${item.bullets.map((bullet) => `<p>• ${escapeHtml(bullet)}</p>`).join('')}</div>`).join('')}` : ''}${draft.projects?.length ? `<h2>PROJECTS</h2>${draft.projects.map((item) => `<div class="item"><strong>${escapeHtml(item.name)}</strong>${item.bullets.map((bullet) => `<p>• ${escapeHtml(bullet)}</p>`).join('')}</div>`).join('')}` : ''}${draft.education?.length ? `<h2>EDUCATION</h2>${draft.education.map((item) => `<p>${escapeHtml([item.qualification, item.institution, item.dates].filter(Boolean).join(' | '))}</p>`).join('')}` : ''}${draft.certifications?.length ? `<h2>CERTIFICATIONS</h2><p>${draft.certifications.map(escapeHtml).join('<br>')}</p>` : ''}${draft.hackathons?.length ? `<h2>HACKATHONS</h2><p>${draft.hackathons.map(escapeHtml).join('<br>')}</p>` : ''}</body></html>`;
  const isDoc = format === 'doc';
  const blob = new Blob([isDoc ? html : plain], { type: isDoc ? 'application/msword' : 'text/plain;charset=utf-8' });
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(blob);
  anchor.download = `${slug(draft.target_company || 'company')}_${slug(draft.target_role || 'targeted_cv')}.${isDoc ? 'doc' : 'txt'}`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(anchor.href);
}
