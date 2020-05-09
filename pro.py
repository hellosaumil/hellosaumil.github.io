# Skills = {
# "Programming" : [ "Python", "C", "Java", "Shell Script (Bash)", "MySQL", "XML", "JSON", "Verilog", "Embedded C", "HTML", "CSS", "JS", "R", "jQuery" ],
#
# "API" : [ "OpenCV", "WebPy", "Apache Jena", "POSIX", "Sci-kit Learn", "NLTK", "TensorFlow", "Graphlab", "Facebook Messenger API", "JDBC", "Hadoop", "Pandas", "Flask", "Apache Spark", "Electron API"],
#
# "Technical" : [ "Protege", "GraphDB", "MySQL Workbench", "MATLAB", "Xcode", "Eclipse" ],
#
# "Design" : [ "SketchUp", "Cinema4D", "iMovie", "Adobe Photoshop", "Adobe AfterEffects" ]
# }

Skills = {
    "Programming" : ['Python,', 'C,', 'Java,', 'Swift,', 'Shell Script (Bash),', 'POSIX,', 'MySQL,', 'Embedded C,', 'HTML,', 'CSS,', 'JavaScript,', 'Ajax,', 'jQuery,', 'R'],

    "APIs & Frameworks" : ['TensorFlow', 'Keras', 'PyTorch', 'Scikit-Learn', 'MATLAB', 'Amazon Web Services (AWS) - Elastic Map Reduce (EMR), EC2, S3', 'Apache Spark', 'Pandas', 'Jupyter notebook', 'REST', 'Flask', 'Git', 'Microsoft CNTK', 'CUDA', 'OpenCV', 'Xcode', 'Heroku', 'Materialize']
}

html = "\n"

for skillset in Skills:
    print ("\n",skillset, " : ")

    for skill in Skills[skillset]:
        print ("\t ", skill)

        itr_per = input("Provide confidence level for "+skill+" : ");

        html += '<div class="item">\n\t<h3 class="level-title">' + skill +'</h3>\n\t<div class="level-bar">\n\t\t<div class="level-bar-inner" data-level="' + itr_per +'%">\n\t\t</div>\n\t</div>\n</div>'

    html += "\n"

print (html)
