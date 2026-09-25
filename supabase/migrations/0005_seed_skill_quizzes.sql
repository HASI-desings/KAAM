-- 0005_seed_skill_quizzes.sql
insert into public.skill_quiz_questions (category_id,question,options,correct_index)
select c.id,v.question,v.options,v.correct_index from (values
('Assignment / Thesis Formatting','Which part of a paper lists the sources cited?','["Reference list","Abstract","Appendix","Title page"]'::jsonb,0),
('Assignment / Thesis Formatting','What is a proper paraphrase?','["Copying a sentence exactly","Restating an idea in your own words with a citation","Removing the citation","Changing only one word"]'::jsonb,1),
('Assignment / Thesis Formatting','Which section normally explains how a study was carried out?','["Methodology","References","Conclusion","Acknowledgements"]'::jsonb,0),
('Content Writing / Copywriting','What is the main purpose of a call to action?','["Hide the main message","Encourage the reader to take a specific action","Increase paragraph length","Replace proofreading"]'::jsonb,1),
('Content Writing / Copywriting','Which headline is usually strongest for clear web copy?','["A vague headline","A specific benefit-focused headline","A headline with no topic","A headline made only of symbols"]'::jsonb,1),
('Content Writing / Copywriting','What does active voice usually do?','["Makes the subject perform the action","Removes the subject","Makes every sentence passive","Eliminates verbs"]'::jsonb,0),
('Data Entry','What does data validation help enforce?','["Consistent and acceptable input","Random formatting","Duplicate records","Deleted rows"]'::jsonb,0),
('Data Entry','What is a duplicate record?','["A repeated record representing the same data","A backup file","A new category","A protected cell"]'::jsonb,0),
('Data Entry','What character commonly begins a spreadsheet formula?','["=","#","@","&"]'::jsonb,0),
('Errands / Local Task Help','What is the main benefit of planning an efficient errand route?','["Less travel time and distance","More unnecessary stops","Higher fuel use","Longer delays"]'::jsonb,0),
('Errands / Local Task Help','What can a receipt provide after a purchase?','["Proof of purchase","A delivery route","A password","A weather report"]'::jsonb,0),
('Errands / Local Task Help','What can confirm that a delivery reached the intended person?','["Delivery confirmation","A random advertisement","A draft invoice","A color palette"]'::jsonb,0),
('Home Tutoring','What is formative assessment used for?','["Checking learning during instruction","Only grading the final exam","Replacing all teaching","Choosing a school uniform"]'::jsonb,0),
('Home Tutoring','What is 1/2 + 1/4?','["3/4","2/6","1/8","2/4"]'::jsonb,0),
('Home Tutoring','What is a useful first goal when tutoring a student who is struggling?','["Identify the specific learning gap","Skip assessment","Increase homework immediately","Avoid questions"]'::jsonb,0),
('Photography','What does aperture primarily control?','["Lens opening and depth of field","Image file name","Camera strap length","Memory card brand"]'::jsonb,0),
('Photography','What does a faster shutter speed help freeze?','["Motion","White balance","Lens focal length","File metadata"]'::jsonb,0),
('Photography','What does white balance primarily correct?','["Color temperature","Image dimensions","Shutter count","Storage capacity"]'::jsonb,0),
('Translation','What is a false cognate?','["Similar-looking words with different meanings","A correctly translated phrase","A punctuation mark","A translation memory file"]'::jsonb,0),
('Translation','Why is context important in translation?','["It helps determine the intended meaning","It always removes ambiguity automatically","It replaces grammar","It makes every word identical"]'::jsonb,0),
('Translation','A faithful translation should primarily preserve what?','["Meaning and intended sense","Word count only","Font style","Page color"]'::jsonb,0),
('Video Editing','What does frame rate describe?','["Frames shown per second","Audio volume only","File name length","Screen brightness"]'::jsonb,0),
('Video Editing','What is a cut in video editing?','["A transition from one shot to another","A microphone setting","A color profile","A camera battery"]'::jsonb,0),
('Video Editing','What does bitrate generally affect?','["Video quality and file size","Camera focus distance","Keyboard layout","Subtitle language"]'::jsonb,0),
('Virtual Assistance','What should a virtual assistant do when two meetings overlap?','["Identify the conflict and resolve or escalate it","Ignore both meetings","Delete the calendar","Change the client name"]'::jsonb,0),
('Virtual Assistance','How should competing tasks generally be prioritized?','["By urgency, importance, and deadlines","By file size only","Alphabetically every time","By screen position"]'::jsonb,0),
('Virtual Assistance','Why is confidentiality important for a virtual assistant?','["The assistant may handle private client information","It improves monitor brightness","It reduces typing speed","It changes file extensions"]'::jsonb,0),
('Web Design / UI-UX','What does responsive design aim to provide?','["Usable layouts across different screen sizes","Only desktop layouts","Only printed pages","A fixed 320px layout everywhere"]'::jsonb,0),
('Web Design / UI-UX','What is semantic HTML useful for?','["Giving content meaningful structure","Adding random colors","Compressing images","Hosting databases"]'::jsonb,0),
('Web Design / UI-UX','Why is sufficient color contrast important?','["It improves readability and accessibility","It increases database speed","It removes all animations","It changes URL routing"]'::jsonb,0)
) v(category_name,question,options,correct_index)
join public.categories c on c.name=v.category_name
where not exists(select 1 from public.skill_quiz_questions q where q.category_id=c.id and q.question=v.question);