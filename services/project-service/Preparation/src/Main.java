import java.sql.SQLOutput;
import java.util.*;

//TIP To <b>Run</b> code, press <shortcut actionId="Run"/> or
// click the <icon src="AllIcons.Actions.Execute"/> icon in the gutter.
public class Main {
    public static void main(String[] args) {
        Project project = new Project(1,"teamFlow","Project Management Pltaform");
        project.displayProject();
        project.setName("Team Flow");
        System.out.println(project.getName());

        Developper developper = new Developper("Malak", "malak@gmail.com","Java");
        developper.displayDevelopperInfo();
        User user1 = new Developper("Malak","malak@gmail","java");
        User user2 = new User("Oussama","oussama@gmail");
        user1.displayRole();
        user2.displayRole();
        System.out.println("--------------------------------------------------");
        List<String> technologies = new ArrayList<>();
        technologies.add("Java");
        technologies.add("Spring");
        technologies.add("Java");
        technologies.add(".NET");
        System.out.println(technologies);
        System.out.println("-------------");
        Set<String> technologie = new HashSet<>();
        technologie.add("Java");
        technologie.add("Spring");
        technologie.add("Java");
        technologie.add(".NET");
        System.out.println(technologie);
        System.out.println("-------------");
        Map<Integer, String> Technos = new HashMap<>();
        Technos.put(1,"Java");
        Technos.put(2,"Spring");
        System.out.println(Technos);
    }
}