update public.sky_ads
set link = replace(link, 'contato@grupomaia.com.br', 'contato@grupomaia.me')
where link like '%contato@grupomaia.com.br%';
